import GuestSignIn from "../components/auth/GuestSignIn";
import GoogleAuth from "../components/auth/google";
import Folder from "../components/folder";
import TermsAndServices from "../components/terms-and-services";

export default function SignIn() {
  return (
    <>
      <Folder
        className="grid place-items-center gap-4"
        insert={<img src="/cat_sad.png" className="w-44 -translate-y-10"></img>}
        title={<Title />}
      >
        <GoogleAuth />
        <TermsAndServices />
      </Folder>
      <GuestSignIn />
    </>
  );
}

function Title() {
  return <div>FocusMonster</div>;
}