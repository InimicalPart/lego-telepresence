import LogInForm from "@/components/logInForm";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { cookies } from "next/headers";
import { JWTFromCreds, verifyCreds, verifyJWT } from "@/utils/auth/credentialManager";
import { redirect } from "next/navigation";


import { z } from 'zod'
import LogOut from "@/components/logout";
 
const schema = z.object({
    username: z.string({
        invalid_type_error: 'Invalid username',
    }),
    password: z.string({
        invalid_type_error: 'Invalid password',
    })
})



export default async function LoginPage(
    {
        searchParams
    }:{
        searchParams: any
    }

) {
    const logOut = (await searchParams)?.logout === "true"

    async function logOutAction(){
        "use server"
        if (logOut) {
            (await cookies()).delete("auth-ltp");
            return redirect("/login")
        }
    }

    const authCookie = (await cookies())?.get("auth-ltp");



    if (authCookie && !logOut) {
        const verifyResult = await verifyJWT(authCookie.value, "ltp-web");

        const isValid = verifyResult !== false;
        
        if (isValid) {
            return redirect("/")
        }
    }

    async function logIn(_: {message: string}, form: FormData) {
        "use server"

        const validatedFields = schema.safeParse({
            username: form.get('username'),
            password: form.get('password')
          })


        if (!validatedFields.success) {
            return {
                message: "Invalid data provided"
            }
        }

        if (await verifyCreds({
            username: form.get("username") as string,
            password: form.get("password") as string
        })) {
            const jwt = await JWTFromCreds({
                username: form.get("username") as string,
                password: form.get("password") as string,
                hostname: "ltp-web"
            });

            (await cookies()).set("auth-ltp", jwt);
        } else {
            return {
                message: "Invalid credentials"
            }
        }

        return {
            message: "There was an error logging in"
        }
    }


    return (
        <div className="flex w-[100dvw] h-[100dvh] justify-center items-center">
            {logOut ? <LogOut action={logOutAction}/> : null}
            <Card >
                <CardHeader className="flex justify-center items-center">
                    <p>Log In to <b>LTP-WEB</b></p>
                </CardHeader>
                <CardBody>
                    <LogInForm onLogIn={logIn} />
                </CardBody>
            </Card>

        </div>
  );
}