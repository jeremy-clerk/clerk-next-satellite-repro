import Link from "next/link";

export default function Page(){

     return(
         <div>
         <p>
             Hello
         </p>
             <Link href={"/dashboard"} >Dashboard</Link>
         </div>
     )
}