import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Функция для получения информации о клиенте
function getClientInfo(request: Request) {
  const headersList = headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const userAgent = headersList.get('user-agent');
  
  const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return {
    ipAddress,
    userAgent: userAgent || 'unknown'
  };
}

// Функция для создания записи аудита
async function createAuditLog(
  tx: any,
  orderId: string,
  action: string,
  fieldName: string | null,
  oldValue: string | null,
  newValue: string | null,
  comment: string | null,
  clientInfo: { ipAddress: string; userAgent: string }
) {
  await tx.orderAudit.create({
    data: {
      orderId,
      action,
      fieldName,
      oldValue,
      newValue,
      adminName: 'Admin', // TODO: получать из сессии когда будет авторизация
      comment,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    }
  });
}

// GET - получить заказ по ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    category: {
                      select: {
                        name: true
                      }
                    }
                  }
                },
                images: true,
                attributes: true
              }
            }
          }
        },
        payment: true,
        audits: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Преобразуем данные для фронтенда
    const transformedOrder = {
      ...order,
      totalPrice: Number(order.totalPrice),
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      productsCount: order.items.length,
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        variant: {
          ...item.variant,
          price: Number(item.variant.price),
          discountPrice: item.variant.discountPrice ? Number(item.variant.discountPrice) : null,
          mainImage: item.variant.images?.find(img => img.isMain)?.imageUrl || 
                     item.variant.images?.[0]?.imageUrl || null
        }
      })),
      payment: order.payment ? {
        ...order.payment,
        amount: Number(order.payment.amount)
      } : null
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения заказа', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - обновить заказ
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      status, 
      customerName, 
      customerPhone, 
      contactType, 
      customerAddress,
      paymentStatus,
      comment 
    } = body;

    const clientInfo = getClientInfo(request);

    // Проверяем существование заказа
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // БЕЗОПАСНОЕ РЕДАКТИРОВАНИЕ: Проверяем ограничения
    
    // 1. Нельзя редактировать завершенные заказы (кроме статуса на CANCELLED)
    if (existingOrder.status === 'COMPLETED') {
      if (status && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Завершенный заказ можно только отменить' },
          { status: 400 }
        );
      }
      // Для завершенных заказов можно изменить только статус на CANCELLED
      if (customerName || customerPhone || contactType || customerAddress || paymentStatus) {
        return NextResponse.json(
          { error: 'Нельзя изменять данные завершенного заказа' },
          { status: 400 }
        );
      }
    }

    // 2. Нельзя редактировать отмененные заказы
    if (existingOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Нельзя изменять отмененный заказ' },
        { status: 400 }
      );
    }

    // 3. Нельзя изменить статус с PAID на PENDING
    if (existingOrder.status === 'PAID' && status === 'PENDING') {
      return NextResponse.json(
        { error: 'Нельзя вернуть оплаченный заказ в статус "В ожидании"' },
        { status: 400 }
      );
    }

    // 4. Нельзя изменить статус с SHIPPED или COMPLETED на более ранний (кроме CANCELLED)
    if ((existingOrder.status === 'SHIPPED' || existingOrder.status === 'COMPLETED') && status) {
      const statusOrder = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED'];
      const currentIndex = statusOrder.indexOf(existingOrder.status);
      const newIndex = statusOrder.indexOf(status);
      
      if (newIndex < currentIndex && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Нельзя вернуть заказ на более ранний статус (кроме отмены)' },
          { status: 400 }
        );
      }
    }

    // 5. Нельзя изменить статус платежа с SUCCESS на другой
    if (existingOrder.payment?.status === 'SUCCESS' && paymentStatus && paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Нельзя изменить статус успешного платежа' },
        { status: 400 }
      );
    }

    // Валидация статуса заказа
    if (status && !['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Неверный статус заказа' },
        { status: 400 }
      );
    }

    // Валидация типа контакта
    if (contactType && !['WHATSAPP', 'CALL'].includes(contactType)) {
      return NextResponse.json(
        { error: 'Неверный тип контакта' },
        { status: 400 }
      );
    }

    // Валидация статуса платежа
    if (paymentStatus && !['PENDING', 'SUCCESS', 'FAILED'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Неверный статус платежа' },
        { status: 400 }
      );
    }

    // Обновляем заказ в транзакции с записью аудита
    const result = await prisma.$transaction(async (tx) => {
      const changes: Array<{field: string, oldValue: string, newValue: string}> = [];

      // Отслеживаем изменения
      if (status && status !== existingOrder.status) {
        changes.push({
          field: 'status',
          oldValue: existingOrder.status,
          newValue: status
        });
      }

      if (customerName && customerName.trim() !== existingOrder.customerName) {
        changes.push({
          field: 'customerName',
          oldValue: existingOrder.customerName,
          newValue: customerName.trim()
        });
      }

      if (customerPhone && customerPhone.trim() !== existingOrder.customerPhone) {
        changes.push({
          field: 'customerPhone',
          oldValue: existingOrder.customerPhone,
          newValue: customerPhone.trim()
        });
      }

      if (contactType && contactType !== existingOrder.contactType) {
        changes.push({
          field: 'contactType',
          oldValue: existingOrder.contactType,
          newValue: contactType
        });
      }

      if (customerAddress && customerAddress.trim() !== existingOrder.customerAddress) {
        changes.push({
          field: 'customerAddress',
          oldValue: existingOrder.customerAddress,
          newValue: customerAddress.trim()
        });
      }

      // Обновляем основную информацию о заказе
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(customerName && { customerName: customerName.trim() }),
          ...(customerPhone && { customerPhone: customerPhone.trim() }),
          ...(contactType && { contactType }),
          ...(customerAddress && { customerAddress: customerAddress.trim() })
        }
      });

      // Обновляем статус платежа, если указан
      if (paymentStatus && existingOrder.payment && paymentStatus !== existingOrder.payment.status) {
        changes.push({
          field: 'paymentStatus',
          oldValue: existingOrder.payment.status,
          newValue: paymentStatus
        });

        await tx.payment.update({
          where: { orderId: id },
          data: {
            status: paymentStatus
          }
        });
      }

      // Если заказ отменяется, возвращаем товары на склад
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id }
        });

        for (const item of orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }

        // Записываем специальный аудит для отмены заказа
        await createAuditLog(
          tx,
          id,
          'STATUS_CHANGE',
          'status',
          existingOrder.status,
          'CANCELLED',
          `Заказ отменен. Товары возвращены на склад. ${comment || ''}`.trim(),
          clientInfo
        );
      } else {
        // Записываем обычный аудит изменений
        if (changes.length > 0) {
          for (const change of changes) {
            await createAuditLog(
              tx,
              id,
              change.field === 'status' ? 'STATUS_CHANGE' : 'UPDATE',
              change.field,
              change.oldValue,
              change.newValue,
              comment || null,
              clientInfo
            );
          }
        }
      }

      return updatedOrder;
    });

    // Получаем обновленный заказ с полными данными
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    category: {
                      select: {
                        name: true
                      }
                    }
                  }
                },
                images: true
              }
            }
          }
        },
        payment: true
      }
    });

    return NextResponse.json({
      ...fullOrder,
      totalPrice: Number(fullOrder?.totalPrice || 0),
      payment: fullOrder?.payment ? {
        ...fullOrder.payment,
        amount: Number(fullOrder.payment.amount)
      } : null
    });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления заказа', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE метод удален - заказы нельзя удалять, только отменять
