import { StoreOrder } from '../types';
import { BUSINESS_INFO } from '../data/watches';

/**
 * Triggers standard browser print or ESC/POS compatible thermal receipt layout
 */
export function printInvoice(order: StoreOrder, type: 'tax_invoice' | 'thermal_slip' = 'tax_invoice') {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to print receipt/invoice');
    return;
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isThermal = type === 'thermal_slip';
  const isPrepaid = order.paymentMethod === 'upi_qr';

  const invoiceItems = order.items && order.items.length > 0
    ? order.items
    : [
        {
          name: order.productName || 'Timevera Watch',
          quantity: Number(order.quantity) || 1,
          price: Number(order.productPrice) || Number(order.price) || Number(order.totalAmount) || 0,
        },
      ];

  const calculatedSubtotal = Number(order.subtotal) || Number(order.subtotalAmount) || invoiceItems.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const calculatedDiscount = Number(order.discount) || Number(order.discountAmount) || Number(order.couponDiscount) || 0;
  const deliveryCharge = Number(order.deliveryCharge) || Number(order.shipping) || 0;
  const calculatedGrandTotal = Number(order.finalAmount) || Number(order.totalAmount) || Number(order.grandTotal) || Math.max(0, calculatedSubtotal - calculatedDiscount + deliveryCharge);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.id}</title>
  <style>
    @media print {
      body { margin: 0; padding: ${isThermal ? '5px' : '20px'}; }
      @page { size: ${isThermal ? '80mm auto' : 'A4'}; margin: ${isThermal ? '2mm' : '10mm'}; }
    }
    body {
      font-family: ${isThermal ? "'Courier New', Courier, monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
      color: #000;
      background: #fff;
      font-size: ${isThermal ? '12px' : '14px'};
      line-height: 1.4;
      max-width: ${isThermal ? '320px' : '750px'};
      margin: 0 auto;
      padding: ${isThermal ? '10px' : '30px'};
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .border-top { border-top: 1px dashed #000; padding-top: 6px; margin-top: 8px; }
    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px; }
    .divider { border-bottom: 1px solid #ccc; margin: 15px 0; }
    .flex { display: flex; justify-content: space-between; }
    .logo { font-size: ${isThermal ? '18px' : '24px'}; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .tagline { font-size: 10px; color: #555; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: inherit; }
    th { text-align: left; border-bottom: 1px solid #000; padding: 6px 0; font-size: ${isThermal ? '11px' : '12px'}; }
    td { padding: 6px 0; }
    .badge-prepaid {
      display: inline-block;
      padding: 4px 10px;
      border: 2px solid #000;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .badge-cod {
      display: inline-block;
      padding: 4px 10px;
      border: 2px dashed #000;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="text-center">
    <div class="logo">${BUSINESS_INFO.name}</div>
    <div class="tagline">${BUSINESS_INFO.tagline}</div>
    <div>${BUSINESS_INFO.address}</div>
    <div>Email: ${BUSINESS_INFO.email} | UPI: ${BUSINESS_INFO.upiId}</div>
    
    <!-- Prominent Payment Mode Badge -->
    <div style="margin-top: 8px;">
      <span class="${isPrepaid ? 'badge-prepaid' : 'badge-cod'}">
        BILL TYPE: ${isPrepaid ? '★ PREPAID (PAID ONLINE) ★' : '★ CASH ON DELIVERY (COD) ★'}
      </span>
    </div>
  </div>

  <div class="border-top border-bottom" style="margin-top: 10px;">
    <div class="flex">
      <span><strong>ORDER #:</strong> ${order.id}</span>
      <span><strong>STATUS:</strong> ${(order.orderStatus || 'ORDER RECEIVED').toUpperCase()}</span>
    </div>
    <div class="flex" style="font-size: 11px; margin-top: 4px;">
      <span><strong>DATE:</strong> ${formattedDate}</span>
      <span><strong>PAYMENT:</strong> <strong style="text-decoration: underline;">${isPrepaid ? 'PREPAID (ONLINE UPI)' : 'COD (PAY ON DELIVERY)'}</strong></span>
    </div>
  </div>

  <!-- Customer Details -->
  <div style="margin: 10px 0;">
    <div class="text-bold" style="font-size: 11px; text-transform: uppercase; color: #333;">Customer & Delivery Address:</div>
    <div class="text-bold" style="font-size: ${isThermal ? '13px' : '15px'};">${order.customerName}</div>
    <div>Phone: <strong>${order.customerPhone}</strong></div>
    <div>Address: ${order.customerAddress}, ${order.customerCity} - <strong>${order.customerPincode}</strong></div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Item</th>
        <th class="text-center" style="width: 15%;">Qty</th>
        <th class="text-right" style="width: 15%;">Price</th>
        <th class="text-right" style="width: 20%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceItems
        .map(
          (item) => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td class="text-center">${Number(item.quantity) || 1}</td>
          <td class="text-right">₹${(Number(item.price) || 0).toLocaleString('en-IN')}</td>
          <td class="text-right">₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- Calculation Summary -->
  <div class="border-top" style="padding-top: 8px;">
    <div class="flex">
      <span>Subtotal:</span>
      <span>₹${calculatedSubtotal.toLocaleString('en-IN')}</span>
    </div>
    ${
      calculatedDiscount > 0
        ? `
    <div class="flex" style="font-size: 11px; color: #16a34a;">
      <span>Coupon Discount ${order.couponCode ? `(${order.couponCode})` : ''}:</span>
      <span>-₹${calculatedDiscount.toLocaleString('en-IN')}</span>
    </div>
    `
        : ''
    }
    <div class="flex" style="font-size: 11px; color: #444;">
      <span>Delivery Charges:</span>
      <span>${deliveryCharge === 0 ? 'FREE (₹0)' : '₹' + deliveryCharge.toLocaleString('en-IN')}</span>
    </div>
    <div class="flex border-top" style="font-size: ${isThermal ? '14px' : '18px'}; font-weight: bold; margin-top: 6px;">
      <span>TOTAL AMOUNT:</span>
      <span>₹${calculatedGrandTotal.toLocaleString('en-IN')}</span>
    </div>
    <div class="flex" style="font-size: 12px; font-weight: bold; margin-top: 4px;">
      <span>AMOUNT TO COLLECT:</span>
      <span>${isPrepaid ? '₹0 (ALREADY PREPAID)' : '₹' + calculatedGrandTotal.toLocaleString('en-IN') + ' (COD CASH)'}</span>
    </div>
  </div>

  ${
    isPrepaid && order.utrNumber
      ? `
    <div style="margin-top: 8px; font-size: 10px; background: #f4f4f4; padding: 4px; border-radius: 3px;">
      <strong>Payment Mode:</strong> PREPAID (Online UPI)
    </div>
  `
      : ''
  }

  <!-- Footer Notice -->
  <div class="text-center border-top" style="margin-top: 15px; font-size: 10px;">
    <p>6 Months Movement Warranty Included • 100% Inspected</p>
    <p>*** Thank You For Shopping With ${BUSINESS_INFO.name}! ***</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
