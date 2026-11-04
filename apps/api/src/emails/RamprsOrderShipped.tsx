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
  Button,
} from '@react-email/components';
import { Order } from '@ramprs/shared';

interface RamprsOrderShippedProps {
  order: Order;
  courierName: string;
  awbNumber: string;
  trackingUrl: string;
}

export const RamprsOrderShipped: React.FC<RamprsOrderShippedProps> = ({
  order,
  courierName,
  awbNumber,
  trackingUrl,
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

          {/* Heading */}
          <Section style={contentSection}>
            <Heading as="h2" style={h2Style}>
              Your RAMPRS Order Is On The Way! 🚀
            </Heading>
            <Text style={paragraphStyle}>
              Hi {order.shipping_address.full_name}, great news! Your order #{order.order_number} has been packed with signature RAMPRS luxury packaging and handed over to our express logistics partner.
            </Text>
          </Section>

          {/* Shipment Details Box */}
          <Section style={shipmentBoxStyle}>
            <Text style={boxLabel}>Courier Partner</Text>
            <Text style={boxValue}>{courierName}</Text>

            <Text style={{ ...boxLabel, marginTop: '12px' }}>AWB Tracking Number</Text>
            <Text style={boxValue}>{awbNumber}</Text>

            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button style={ctaButtonStyle} href={trackingUrl}>
                Track Your RAMPRS Package
              </Button>
            </Section>
          </Section>

          {/* Delivery Address */}
          <Section style={addressSection}>
            <Text style={h3Style}>Shipping To</Text>
            <Text style={paragraphStyle}>
              {order.shipping_address.full_name}<br />
              {order.shipping_address.line1}<br />
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Need assistance with your delivery? Contact our priority concierge at support@ramprs.com
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

export default RamprsOrderShipped;

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
  fontSize: '14px',
  fontWeight: '600',
  color: '#27272a',
  margin: '0 0 8px 0',
  textTransform: 'uppercase',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3f3f46',
  margin: '0',
};

const shipmentBoxStyle: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #e4e4e7',
};

const boxLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#71717a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0',
};

const boxValue: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#09090b',
  margin: '4px 0 0 0',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
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

