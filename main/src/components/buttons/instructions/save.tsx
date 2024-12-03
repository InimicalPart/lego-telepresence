"use client";

import { DownloadIcon } from "@/components/icons";
import { Button } from "@nextui-org/react";
import { useState } from "react";
import { toast } from "sonner";

export default function SaveButton() {

    const [saving, setSaving] = useState(false);

    function saveToFile() {
        setSaving(true);
        window.dispatchEvent(new CustomEvent("LTP-InstructionsGet", {
            detail: {
                callback: (i: any) => {

                    if (i.length == 0) {
                        toast.warning("Nothing to save!", {
                            description: "The instructions list is empty, there is nothing to save.",
                            duration: 3000
                        })
                        return setSaving(false);
                    }


                    const a = document.createElement("a");
                    const file = new Blob([JSON.stringify(i.map((inst: any)=>{
                        return {
                            name: inst.name,
                            type: inst.type,
                            data: inst.data
                        }
                    }))], {type: 'application/json'});
                    a.href = URL.createObjectURL(file);

                    const now = new Date();

                    const timestampStructure = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;

                    a.download = `LTP-Instructions-${timestampStructure}.json`;
                    a.click();
                    setSaving(false);
                }
            }
        }))
    }

    return (
        <Button color="primary" variant="solid" className="w-full" startContent={<DownloadIcon size={16} />} onClick={saveToFile} isDisabled={saving} disabled={saving}>
            {saving ? "Saving..." : "Save to file"}
        </Button>
    )
}