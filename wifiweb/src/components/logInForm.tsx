/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use client"

import { Spacer, Button, Input} from "@nextui-org/react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

const initialState = {
    message: ''
  }

export default function LogInForm({onLogIn}:{
    onLogIn: (_:any, form: FormData) => Promise<{ message: string; }>
}) {

    const [state, submitFormAction] = useActionState(onLogIn as any, initialState)    
    const { pending } = useFormStatus()

    return (
        <form action={submitFormAction} className="flex flex-col justify-center items-center gap-2">
        <Input autoComplete="username" variant="bordered" label="Username" type="text" name="username" placeholder="Username" required/>
        <Input autoComplete="current-password" variant="bordered" label="Password" type="password" name="password" placeholder="Password" required/>
        <p aria-live="polite" className="text-sm text-red-500" hidden={!state.message}>{state?.message}</p>

        <Spacer y={2} />
        <Button type="submit" className="w-60" disabled={pending}>{pending ? "Logging in..." : "Log in"}</Button>
    </form>
    );
}