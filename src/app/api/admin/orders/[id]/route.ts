import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Функция для получения информации о клиенте (пока не используется)
// async function getClientInfo() {
//   const headersList = await headers();
//   const forwarded = headersList.get('x-forwarded-for');
//   const realIp = headersList.get('x-real-ip');
//   const userAgent = headersList.get('user-agent');
//   
//   const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
//   
//   return {
//     ipAddress,
//     userAgent: userAgent || 'unknown'
//   };
// }


// GET - получить заказ по ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        courier: {
          select: {
            id: true,
            fullname: true,
            phoneNumber: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            size: {
              select: {
                id: true,
                name: true
              }
            },
            color: {
              select: {
                id: true,
                name: true,
                colorCode: true
              }
            }
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
    const totalPrice = order.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.amount), 0);
    const itemsCount = order.orderItems.reduce((sum, item) => sum + item.amount, 0);
    
    const transformedOrder = {
      ...order,
      totalPrice,
      itemsCount,
      productsCount: order.orderItems.length,
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          imageUrl: item.product.imageUrl // This is already JSON array
        }
      }))
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения заказа', details: (error as Error)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - обновить заказ
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      status, 
      customerName, 
      customerPhone, 
      customerAddress,
      adminComment,
      comment 
    } = body;

    // Получаем информацию о клиенте (пока не используется)
    // const clientInfo = await getClientInfo();

    // Проверяем существование заказа
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        courier: {
          select: {
            id: true,
            fullname: true,
            phoneNumber: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
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
    if (existingOrder.status === 'DELIVERED') {
      if (status && status !== 'CANCELED') {
        return NextResponse.json(
          { error: 'Завершенный заказ можно только отменить' },
          { status: 400 }
        );
      }
      // Для завершенных заказов можно изменить только статус на CANCELED
      if (customerName || customerPhone || customerAddress || adminComment) {
        return NextResponse.json(
          { error: 'Нельзя изменять данные завершенного заказа' },
          { status: 400 }
        );
      }
    }

    // 2. Нельзя редактировать отмененные заказы
    if (existingOrder.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Нельзя изменять отмененный заказ' },
        { status: 400 }
      );
    }

    // 3. Нельзя изменить статус с DELIVERED на более ранний (кроме CANCELED)
    if (existingOrder.status === 'DELIVERED' && status && status !== 'CANCELED') {
      return NextResponse.json(
        { error: 'Доставленный заказ можно только отменить' },
        { status: 400 }
      );
    }

    // Валидация статуса заказа
    if (status && !['CREATED', 'COURIER_WAIT', 'COURIER_PICKED', 'ENROUTE', 'DELIVERED', 'CANCELED'].includes(status)) {
      return NextResponse.json(
        { error: 'Неверный статус заказа' },
        { status: 400 }
      );
    }

    // Обновляем заказ в транзакции с записью аудита
    await prisma.$transaction(async (tx) => {
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

      if (customerAddress && customerAddress.trim() !== existingOrder.deliveryAddress) {
        changes.push({
          field: 'deliveryAddress',
          oldValue: existingOrder.deliveryAddress,
          newValue: customerAddress.trim()
        });
      }

      if (adminComment && adminComment.trim() !== existingOrder.adminComment) {
        changes.push({
          field: 'adminComment',
          oldValue: existingOrder.adminComment || '',
          newValue: adminComment.trim()
        });
      }

      // Обновляем основную информацию о заказе
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(customerName && { customerName: customerName.trim() }),
          ...(customerPhone && { customerPhone: customerPhone.trim() }),
          ...(customerAddress && { deliveryAddress: customerAddress.trim() }),
          ...(adminComment && { adminComment: adminComment.trim() })
        }
      });


      // Если заказ отменяется, обновляем cancelComment
      if (status === 'CANCELED' && existingOrder.status !== 'CANCELED') {
        await tx.order.update({
          where: { id },
          data: {
            cancelComment: comment || 'Заказ отменен администратором'
          }
        });
      }

      return updatedOrder;
    });

    // Получаем обновленный заказ с полными данными
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        courier: {
          select: {
            id: true,
            fullname: true,
            phoneNumber: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            size: {
              select: {
                id: true,
                name: true
              }
            },
            color: {
              select: {
                id: true,
                name: true,
                colorCode: true
              }
            }
          }
        }
      }
    });

    if (!fullOrder) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Вычисляем общую стоимость
    const totalPrice = fullOrder.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.amount), 0);
    const itemsCount = fullOrder.orderItems.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({
      ...fullOrder,
      totalPrice,
      itemsCount,
      productsCount: fullOrder.orderItems.length,
      orderItems: fullOrder.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          imageUrl: item.product.imageUrl
        }
      }))
    });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления заказа', details: (error as Error)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE метод удален - заказы нельзя удалять, только отменять
