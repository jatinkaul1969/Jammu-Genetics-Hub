export function buildPickupReminderMessage(params: {
  patientName: string;
  slot: string;
  phleboName: string;
  phleboPhone: string;
}) {
  const { patientName, slot, phleboName, phleboPhone } = params;
  return `Hi ${patientName}! 👋

Your home sample collection is coming up today, ${slot}.

Your phlebotomist: *${phleboName}*
Contact number: +91 ${phleboPhone}

They'll be in touch shortly before arriving. Thanks for choosing Jammu Genetics Hub!`;
}
