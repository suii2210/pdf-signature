export default function ActionsPanel({
  onSign,
  isSigning,
  canSign,
  signedUrl,
  status,
}) {
  return (
    <>
      <button type="button" onClick={onSign} disabled={isSigning || !canSign}>
        {isSigning ? "Signing..." : "Sign PDF"}
      </button>
      {signedUrl ? (
        <a className="link" href={signedUrl} target="_blank" rel="noreferrer">
          Open signed PDF
        </a>
      ) : null}
      {status ? <p className="status">{status}</p> : null}
    </>
  );
}
