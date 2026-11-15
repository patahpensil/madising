import {redirect} from 'next/navigation';
import TrialPage from './fixture-page';
export const dynamic='force-dynamic';
export default function Page(){
 if(process.env.MADISING_FIXTURE_HARNESS==='1')return <TrialPage/>;
 redirect('/account');
}
