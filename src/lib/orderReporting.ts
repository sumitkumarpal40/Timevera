import { StoreOrder } from '../types';

export type DateFilterType = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export interface DateReportStats {
  totalOrders: number;
  totalRevenue: number;
  newCount: number;
  confirmedCount: number;
  packedCount: number;
  billedCount: number;
  dispatchedCount: number;
  deliveredCount: number;
  cancelledCount: number;
}

/**
 * Returns formatted local YYYY-MM-DD string
 */
export function getLocalDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filters orders according to the selected date range
 */
export function filterOrdersByDate(
  orders: StoreOrder[],
  dateFilter: DateFilterType,
  customDate?: string
): StoreOrder[] {
  const today = getLocalDateString(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = getLocalDateString(sevenDaysAgo);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = getLocalDateString(thirtyDaysAgo);

  return orders.filter((order) => {
    // Determine order date from orderDate or createdAt
    const oDate = order.orderDate || order.createdAt?.split('T')[0] || getLocalDateString(new Date(order.createdAt || Date.now()));

    switch (dateFilter) {
      case 'today':
        return oDate === today;
      case 'yesterday':
        return oDate === yesterday;
      case '7days':
        return oDate >= sevenDaysStr;
      case '30days':
        return oDate >= thirtyDaysStr;
      case 'custom':
        return customDate ? oDate === customDate : true;
      case 'all':
      default:
        return true;
    }
  });
}

/**
 * Calculates date stats summary
 */
export function calculateOrderStats(orders: StoreOrder[]): DateReportStats {
  const stats: DateReportStats = {
    totalOrders: orders.length,
    totalRevenue: 0,
    newCount: 0,
    confirmedCount: 0,
    packedCount: 0,
    billedCount: 0,
    dispatchedCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
  };

  orders.forEach((ord) => {
    if (ord.orderStatus !== 'Cancelled') {
      stats.totalRevenue += ord.totalAmount || 0;
    }

    switch (ord.orderStatus) {
      case 'Order Received':
        stats.newCount++;
        break;
      case 'Confirmed':
        stats.confirmedCount++;
        break;
      case 'Packed':
        stats.packedCount++;
        break;
      case 'Shipped':
        stats.dispatchedCount++;
        break;
      case 'Delivered':
        stats.deliveredCount++;
        break;
      case 'Cancelled':
        stats.cancelledCount++;
        break;
    }

    // Check additional status flags
    if (ord.packedAt || ord.orderStatus === 'Packed' || ord.orderStatus === 'Shipped' || ord.orderStatus === 'Delivered') {
      // counted in packed if specifically packed or progressed past
    }
    if (ord.printed || ord.billed || ord.billedAt || (ord.printCount && ord.printCount > 0)) {
      stats.billedCount++;
    }
  });

  return stats;
}

export interface DayGroup {
  date: string;
  formattedDate: string;
  orders: StoreOrder[];
  stats: DateReportStats;
}

/**
 * Groups orders by date (YYYY-MM-DD) in descending order
 */
export function groupOrdersByDate(orders: StoreOrder[]): DayGroup[] {
  const map = new Map<string, StoreOrder[]>();

  orders.forEach((ord) => {
    const oDate = ord.orderDate || ord.createdAt?.split('T')[0] || getLocalDateString(new Date(ord.createdAt || Date.now()));
    if (!map.has(oDate)) {
      map.set(oDate, []);
    }
    map.get(oDate)!.push(ord);
  });

  const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  return sortedDates.map((dateStr) => {
    const dayOrders = map.get(dateStr) || [];
    let formattedDate = dateStr;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const pretty = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        weekday: 'short',
      });
      if (dateStr === todayStr) {
        formattedDate = `⭐ Aaj (Today) - ${pretty}`;
      } else if (dateStr === yesterdayStr) {
        formattedDate = `📅 Kal (Yesterday) - ${pretty}`;
      } else {
        formattedDate = `📅 ${pretty}`;
      }
    } catch {
      formattedDate = dateStr;
    }

    return {
      date: dateStr,
      formattedDate,
      orders: dayOrders,
      stats: calculateOrderStats(dayOrders),
    };
  });
}


/**
 * Exports orders list to downloadable CSV
 */
export function exportOrdersCSV(orders: StoreOrder[], filenamePrefix: string = 'timevera_orders_report') {
  if (!orders || orders.length === 0) {
    alert('Export karne ke liye koi orders nahi hain!');
    return;
  }

  const headers = [
    'Order ID',
    'Order Date',
    'Created At',
    'Customer Name',
    'Phone',
    'Address',
    'City',
    'Pincode',
    'Watches Ordered',
    'Total Amount',
    'Payment Method',
    'Order Status',
    'Printed / Billed',
    'Print Count',
    'Packed At',
    'Billed At',
    'Dispatched At',
    'Courier Partner',
    'Courier Tracking No',
    'Delivered At',
  ];

  const rows = orders.map((o) => {
    const itemsStr = o.items.map((it) => `${it.name} (x${it.quantity})`).join('; ');
    return [
      `"${o.id}"`,
      `"${o.orderDate || o.createdAt?.split('T')[0] || ''}"`,
      `"${o.createdAt || ''}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone || ''}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${(o.customerCity || '').replace(/"/g, '""')}"`,
      `"${o.customerPincode || ''}"`,
      `"${itemsStr.replace(/"/g, '""')}"`,
      o.totalAmount || 0,
      `"${o.paymentMethod || ''}"`,
      `"${o.orderStatus || ''}"`,
      o.printed || o.billed ? 'YES' : 'NO',
      o.printCount || 0,
      `"${o.packedAt || ''}"`,
      `"${o.billedAt || ''}"`,
      `"${o.dispatchedAt || ''}"`,
      `"${o.courierPartner || ''}"`,
      `"${o.courierTrackingNumber || ''}"`,
      `"${o.deliveredAt || ''}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filenamePrefix}_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
