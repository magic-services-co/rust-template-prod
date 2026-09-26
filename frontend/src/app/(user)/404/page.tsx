import { getMetadata } from "@/lib/metadata";
import { ErrorCta, ErrorPage } from "@/components/error-page";

export async function generateMetadata() {
  return await getMetadata("404");
}

export default function NotFoundPreviewPage() {
  return (
    <ErrorPage
      kicker="PAGE ERROR"
      title="404"
      titleAccent="NOT FOUND"
      subtitle="Sorry, we couldn't find the page you're looking for. Check the URL or return home."
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
