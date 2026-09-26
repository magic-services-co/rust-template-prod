import { ErrorCta, ErrorPage } from "@/components/error-page";

export default function UserNotFound() {
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
