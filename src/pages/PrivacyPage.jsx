function PrivacyPage() {
  return (
    <article className="prose max-w-3xl">
      <h1>Privacy notice</h1>
      <p>
        This application handles personal information, postpartum health information, screening
        responses, and care records to provide its features. Access is limited by account role and
        sharing permissions. Family sharing is optional and can be revoked by the mother.
      </p>
      <p>
        Screening is a support tool and is not a diagnosis or substitute for clinical care. If there
        is immediate danger, contact local emergency services.
      </p>
      <p>
        Before using this service for real patient care, the operator must publish a complete
        jurisdiction-specific privacy policy, retention schedule, contact details, lawful basis,
        and data-subject rights process. Review HIPAA, GDPR, and the India DPDP Act requirements with
        qualified legal and clinical professionals. This notice is not legal advice.
      </p>
      <p>
        On account deletion, your identity is deleted within 30 days. Health records are retained
        in anonymized form for seven years, after which they are permanently deleted. The archive
        is stored encrypted in a separately configured Google Cloud Storage archive bucket. The
        operator must confirm this retention period is lawful for the service’s jurisdiction
        before enabling account deletion.
      </p>
    </article>
  );
}

export default PrivacyPage;
