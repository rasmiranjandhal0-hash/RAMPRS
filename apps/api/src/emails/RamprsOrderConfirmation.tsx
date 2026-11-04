import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import { Order, OrderItem, formatRupees } from '@ramprs/shared';

interface RamprsOrderConfirmationProps {
  order: Order;
  items: OrderItem[];
}

export const RamprsOrderConfirmation: React.FC<RamprsOrderConfirmationProps> = ({
  order,
  items,
}) => {
  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={brandStyle}>RAMPRS</Heading>
            <Text style={taglineStyle}>THE LUXURY STREETWEAR & BESPOKE TAILORING</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Greeting */}
          <Section style={contentSection}>
            <Heading as="h2" style={h2Style}>
              Order Confirmed: #{order.order_number}
            </Heading>
            <Text style={paragraphStyle}>
              Hi {order.shipping_address.full_name}, thank you for your order! We are preparing your RAMPRS garments with utmost care. Below is your itemized order receipt.
            </Text>
          </Section>

          {/* Itemized Table */}
          <Section style={itemSection}>
            <Heading as="h3" style={h3Style}>Item Details</Heading>
            {items.map((item) => (
              <Row key={item.id} style={itemRowStyle}>
                <Column style={{ width: '70%' }}>
                  <Text style={itemTitleStyle}>
                    {item.title_snapshot}
                  </Text>
                  <Text style={itemSubtextStyle}>
                    SKU: {item.sku_snapshot} | Size: {item.size_snapshot} | Color: {item.color_snapshot} | Qty: {item.quantity}
                  </Text>
                </Column>
                <Column style={{ width: '30%', textAlign: 'right' }}>
                  <Text style={itemPriceStyle}>
                    {formatRupees(item.total_price_paise)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={dividerStyle} />

          {/* Price Breakdown */}
          <Section style={summarySection}>
            <Row style={summaryRow}>
              <Column><Text style={summaryLabel}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={summaryVal}>{formatRupees(order.subtotal_paise)}</Text>
              </Column>
            </Row>

            {order.discount_paise > 0 && (
              <Row style={summaryRow}>
                <Column>
                  <Text style={summaryLabel}>Discount ({order.coupon_code || 'PROMO'})</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ ...summaryVal, color: '#16a34a' }}>
                    -{formatRupees(order.discount_paise)}
                  </Text>
                </Column>
              </Row>
            )}

            <Row style={summaryRow}>
              <Column><Text style={summaryLabel}>GST (12% Apparel Tax Included)</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={summaryVal}>{formatRupees(order.gst_paise)}</Text>
              </Column>
            </Row>

            <Row style={summaryRow}>
              <Column><Text style={summaryLabel}>Shipping (Express Pan-India)</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={summaryVal}>
                  {order.shipping_paise === 0 ? 'FREE' : formatRupees(order.shipping_paise)}
                </Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row style={summaryRow}>
              <Column><Text style={totalLabel}>Grand Total</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={totalVal}>{formatRupees(order.total_paise)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={dividerStyle} />

          {/* Delivery Address */}
          <Section style={addressSection}>
            <Heading as="h3" style={h3Style}>Shipping Address</Heading>
            <Text style={paragraphStyle}>
              {order.shipping_address.full_name}<br />
              {order.shipping_address.line1}<br />
              {order.shipping_address.line2 ? `${order.shipping_address.line2}\n` : ''}
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}<br />
              Phone: +91 {order.shipping_address.phone}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Need to exchange a size? You can request a 7-day hassle-free size exchange directly from your RAMPRS Account page once delivered.
            </Text>
            <Text style={footerCopyright}>
              © 2026 RAMPRS Clothing. All Rights Reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RamprsOrderConfirmation;

const mainStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '40px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px',
  borderRadius: '8px',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
};

const brandStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '0.25em',
  color: '#09090b',
  margin: '0',
};

const taglineStyle: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.15em',
  color: '#71717a',
  marginTop: '4px',
};

const contentSection: React.CSSProperties = {
  margin: '20px 0',
};

const h2Style: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#09090b',
  margin: '0 0 12px 0',
};

const h3Style: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#27272a',
  margin: '0 0 8px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3f3f46',
  margin: '0',
};

const itemSection: React.CSSProperties = {
  margin: '20px 0',
};

const itemRowStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid #f1f5f9',
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#09090b',
  margin: '0',
};

const itemSubtextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#71717a',
  margin: '4px 0 0 0',
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#09090b',
  margin: '0',
};

const summarySection: React.CSSProperties = {
  margin: '20px 0',
};

const summaryRow: React.CSSProperties = {
  margin: '6px 0',
};

const summaryLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#71717a',
  margin: '0',
};

const summaryVal: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#09090b',
  margin: '0',
};

const totalLabel: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#09090b',
  margin: '0',
};

const totalVal: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '800',
  color: '#09090b',
  margin: '0',
};

const addressSection: React.CSSProperties = {
  margin: '20px 0',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '32px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '20px',
};

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#71717a',
  lineHeight: '18px',
  margin: '0 0 8px 0',
};

const footerCopyright: React.CSSProperties = {
  fontSize: '11px',
  color: '#a1a1aa',
  margin: '0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

