import { getMetadata } from "@/lib/metadata";
import { ErrorCta, ErrorPage } from "@/components/error-page";

export async function generateMetadata() {
  return await getMetadata("403");
}

export default function ForbiddenPage() {
  return (
    <ErrorPage
      kicker="ACCESS DENIED"
      title="403"
      titleAccent="FORBIDDEN"
      subtitle="You do not have permission to view this page. Contact support if you believe this is an error."
      actions={
        <>
          <ErrorCta href="/">RETURN HOME</ErrorCta>
          <ErrorCta href="/support" variant="secondary">
            CONTACT SUPPORT
          </ErrorCta>
        </>
      }
    />
  );
}
