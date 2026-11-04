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
} from '@react-email/components';
import { RmaRecord } from '@ramprs/shared';

interface RamprsRmaStatusProps {
  rma: RmaRecord;
  customerName: string;
  orderNumber: string;
}

export const RamprsRmaStatus: React.FC<RamprsRmaStatusProps> = ({
  rma,
  customerName,
  orderNumber,
}) => {
  const isExchange = rma.type === 'EXCHANGE';

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
              {isExchange ? 'Size Exchange Update' : 'Return Request Update'}
            </Heading>
            <Text style={paragraphStyle}>
              Hi {customerName}, this is an update regarding your {rma.type.toLowerCase()} request for RAMPRS Order #{orderNumber}.
            </Text>
          </Section>

          {/* Status Box */}
          <Section style={statusBoxStyle}>
            <Text style={boxLabel}>Current Status</Text>
            <Text style={statusBadge}>{rma.status.replace('_', ' ')}</Text>

            {rma.requested_size && (
              <div style={{ marginTop: '12px' }}>
                <Text style={boxLabel}>Replacement Size Requested</Text>
                <Text style={boxValue}>{rma.requested_size}</Text>
              </div>
            )}

            {rma.admin_notes && (
              <div style={{ marginTop: '12px' }}>
                <Text style={boxLabel}>Concierge Notes</Text>
                <Text style={boxValue}>{rma.admin_notes}</Text>
              </div>
            )}
          </Section>

          <Section style={contentSection}>
            <Text style={paragraphStyle}>
              {rma.status === 'APPROVED' &&
                'Your request has been approved! Our logistics executive will arrive at your address for pickup within 24-48 business hours. Please ensure original tags and packaging are intact.'}
              {rma.status === 'COMPLETED' &&
                (isExchange
                  ? 'Your replacement size has been dispatched!'
                  : 'Your refund has been initiated to your original payment method. Please allow 3-5 business days for bank settlement.')}
              {rma.status === 'REJECTED' &&
                'Unfortunately, your request could not be approved based on our quality guidelines. If you have any questions, please reply to this email.'}
              {rma.status === 'PICKUP_SCHEDULED' &&
                'Courier pickup has been scheduled for your return package.'}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Questions? Our dedicated RAMPRS care team is available 24/7 at support@ramprs.com
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

export default RamprsRmaStatus;

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

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3f3f46',
  margin: '0',
};

const statusBoxStyle: React.CSSProperties = {
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

const statusBadge: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '800',
  color: '#09090b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '4px 0 0 0',
};

const boxValue: React.CSSProperties = {
  fontSize: '14px',
  color: '#27272a',
  margin: '4px 0 0 0',
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

