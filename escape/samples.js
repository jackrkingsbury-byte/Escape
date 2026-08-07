/* Sample contracts for the demo button.
   Written for this project — fictional companies, invented numbers, ordinary
   clause language of the kind that appears in real consumer and services
   agreements. Nothing here is copied from a real document. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EscapeSamples = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  return [
    {
      id: 'gym',
      label: 'Gym membership',
      hint: 'The classic. Renews itself, and leaving costs money.',
      counterparty: 'Ironside Fitness',
      reference: 'MEM-40218',
      text: `IRONSIDE FITNESS — MEMBERSHIP AGREEMENT

1.1 The Member agrees to a minimum term of twenty four (24) months calculated from the commencement date.
1.2 This agreement shall automatically renew for successive periods of twelve (12) months at the end of the minimum term.
2.1 The membership fee is R549,00 per month, collected by debit order on the first day of each month.
2.2 The Member authorises the Club to present a debit order against the nominated account for all amounts due.
2.3 The membership fee shall increase annually by 9,5% on each anniversary of the commencement date.
3.1 The Member must give the Club thirty (30) days written notice to cancel this agreement.
3.2 Should the Member cancel prior to the expiry of the minimum term, an early termination fee of R3 500,00 becomes immediately due and payable.
3.3 All fees paid are non-refundable and the Member shall not be entitled to a refund for any period of non-attendance.
4.1 The Club may amend these terms and the club rules at its sole discretion from time to time.
4.2 The Member indemnifies the Club and holds it harmless against all claims arising from the use of the facilities.
4.3 The total liability of the Club shall not exceed the fees paid by the Member in the preceding month.
5.1 The Club may cede and assign its rights under this agreement to any third party without the consent of the Member.
5.2 Should any amount remain unpaid, the entire outstanding balance shall become immediately due and payable and interest shall accrue at 2% per month.
6.1 This agreement is governed by the laws of the Republic of South Africa and the parties consent to the jurisdiction of the Magistrate's Court.`
    },
    {
      id: 'lease',
      label: 'Rental lease',
      hint: 'A deposit, an escalation, and a landlord who can sell the lease on.',
      counterparty: 'Marlow Property Group',
      reference: 'UNIT-14B',
      text: `LEASE AGREEMENT — UNIT 14B

1. The Landlord lets and the Tenant hires the premises for an initial term of 12 months commencing on the occupation date.
2. The monthly rental is R8 900,00 payable in advance on or before the first day of each month.
3. The rental shall escalate by 8% per annum on each anniversary of the commencement date.
4. This lease shall continue on a month-to-month basis after the initial term unless either party gives two (2) calendar months written notice.
5. The Tenant shall pay a deposit of R17 800,00 which shall be forfeited in the event of early termination.
6. Should the Tenant vacate before the expiry of the initial term, the Tenant remains liable for the balance of the rental for the unexpired portion of the lease.
7. Interest shall accrue on any late payment at the prime lending rate plus 3% per annum.
8. The Landlord may assign or cede its rights under this lease to any third party without the consent of the Tenant.
9. The Tenant indemnifies the Landlord against any claim arising from the Tenant's occupation of the premises.
10. The Landlord shall not be liable for any indirect or consequential loss suffered by the Tenant.
11. The Tenant authorises a debit order for the monthly rental.
12. The Landlord may enter the premises at any time to conduct inspections.
13. This lease is governed by the laws of the Republic of South Africa.`
    },
    {
      id: 'freelance',
      label: 'Freelance contract',
      hint: 'You do the work, they own it, and you get paid in 90 days.',
      counterparty: 'Northgate Studios',
      reference: 'SOW-2026-11',
      text: `SERVICES AGREEMENT — NORTHGATE STUDIOS

1. The Contractor shall provide the services and deliverables described in the statement of work.
2. All intellectual property and copyright in the deliverables shall vest in the Client on creation, and the Contractor assigns all right, title and interest in the deliverables to the Client.
3. Payment shall be made within 90 days of receipt of a valid invoice.
4. The Client may terminate this agreement at any time for convenience on written notice to the Contractor.
5. The Contractor may terminate only on sixty (60) days written notice.
6. The Contractor shall not solicit or approach any client of the Client for a period of two years after termination.
7. The Contractor shall not engage in any business which competes with the Client during the term and for 12 months thereafter.
8. The Contractor indemnifies the Client against any claim arising from the deliverables.
9. The total liability of the Client shall not exceed the fees paid under this agreement in the preceding three months.
10. The confidentiality obligations in this clause shall survive termination indefinitely.
11. Any dispute shall be referred to arbitration and the parties waive the right to participate in any class action.
12. The Client may amend the statement of work at its sole discretion from time to time.`
    },
    {
      id: 'fair',
      label: 'A fair one',
      hint: 'So you can see what the scanner does when there is nothing to find.',
      counterparty: 'Bellwood Gardens',
      reference: 'GS-0092',
      text: `GARDEN SERVICES AGREEMENT — BELLWOOD GARDENS

1. Bellwood Gardens will provide weekly garden maintenance at the address given by the customer.
2. The fee is R650 per month and is fixed for the duration of this agreement.
3. This agreement runs one month at a time. It does not renew automatically for any longer period.
4. Either party may terminate at the end of any month by giving 14 days written notice.
5. If the agreement ends mid-month, any unused portion of the fee is refunded pro-rata within 7 days.
6. The customer may cancel within 5 business days of signing for a full refund, with no penalty.
7. Neither party limits its liability for loss caused by its own negligence.
8. Any increase to the fee requires the written agreement of both parties and shall not exceed CPI.
9. Bellwood Gardens will not share the customer's personal information with any third party.
10. Neither party may transfer this agreement to anyone else without the other party's written consent.`
    }
  ];
});
