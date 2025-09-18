import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { LockIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextField } from "~/components/ui/textfield";
import { OrganizationLevelItem } from "../models";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { pziConfig } from "~/.server/pzi-config";
import { Card } from "~/components/ui/card";
import { FormValidationContext } from "react-aria-components";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { loader } from "./list";
import { useEffect, useState } from "react";


export async function action({ request, params }: ActionFunctionArgs) {
    return await handleCUD<OrganizationLevelItem>(
        request,
        (formData) => {
            const formDataEntries = Object.fromEntries(formData);
            const postData: Partial<OrganizationLevelItem> = {
                id: formDataEntries["id"] ? Number(formDataEntries["id"]) : undefined,
                parentId: Number(params.parentId),
                level: 'district',
                name: formDataEntries["name"]?.toString(),
                director: formDataEntries["director"]?.toString(),
                journalApproversGroup: formDataEntries["journalApproversGroup"]?.toString(),
                journalContributorGroup: formDataEntries["journalContributorGroup"]?.toString(),
                journalReadGroup: formDataEntries["journalReadGroup"]?.toString(),
            };

            return postData;
        },
        "api/organizationlevels",
        pziConfig
    );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function Detail() {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const outletContext = useOutletContext<ContextType>();

    const [formKey, setFormKey] = useState(Date.now().toString());
    const fetcher = useFetcher<typeof action>({ key: formKey });

    const actionParam = params.actionParam;

    const mode = actionParam === 'new'
        ? 'insert'
        : 'edit';

    const itemId = mode === 'edit'
        ? parseInt(actionParam!)
        : Number.MIN_SAFE_INTEGER;

    const [selectedItem, setSelectedItem] = useState<OrganizationLevelItem | undefined>(undefined);
    const [changingValues, setChangingValues] = useState(mode === 'insert');

    const editDisabled = !changingValues || fetcher.state !== 'idle';

    useEffect(() => {
        const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
        if (!actionSuccess) {
            return;
        }

        setFormKey(Date.now().toString());

        switch (fetcher.data?.action) {
            case 'delete': {
                navigate(`/records/org-hierarchy/workplaces/${outletContext.workplaceId}/districts${location.search}`);
                break;
            }
            case 'insert': {
                navigate(`/records/org-hierarchy/workplaces/${outletContext.workplaceId}/districts/${fetcher.data.changeResult?.id}${location.search}`, { replace: true });
                break;
            }
        }
    }, [fetcher.state, fetcher.data]);

    useEffect(() => {
        const foundItem = outletContext.items.find((si) => si.id === itemId);

        if (mode === 'edit' && !foundItem) {
            return;
        }

        if (itemId !== Number.MIN_SAFE_INTEGER && foundItem) {
            setChangingValues(false);
            setSelectedItem(foundItem);
        } else {
            setChangingValues(true);
            setSelectedItem({
                id: Number.MIN_SAFE_INTEGER,
                parentId: outletContext.workplaceId
            } as OrganizationLevelItem);
        }

        setFormKey(Date.now().toString());
    }, [itemId, outletContext.items]);

    if (!selectedItem) {
        return null;
    }

    return (
        <Card
            key={`${formKey}-${changingValues}`}
            className="rounded-none border bg-card text-card-foreground shadow-none">
            <fetcher.Form method="POST" className="flex flex-col h-full">
                <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>
                    <fieldset
                        disabled={editDisabled}
                        className="flex flex-wrap gap-2 p-2 bg-secondary">

                        <TextField name="name"
                            defaultValue={selectedItem.name}
                            className="grow">
                            <Label>Název</Label>
                            <Input type="text" />
                            <FieldError />
                        </TextField>

                    </fieldset>

                    <div className="flex">
                        <div className="grow"></div>
                        <div className="flex gap-1 p-2">
                            <Button variant='outline'
                                size="sm"
                                isDisabled={changingValues || !outletContext.hasEditPermission}
                                onPressChange={() => {
                                    setChangingValues(true);
                                }}>
                                <LockIcon className="size-3" />
                            </Button>
                        </div>
                    </div>

                    <fieldset
                        className="grid grid-cols-4 gap-2 p-2"
                        disabled={editDisabled}>

                        <TextField
                            name="director"
                            defaultValue={selectedItem?.director}
                            className="col-span-2">
                            <Label>Ředitel</Label>
                            <Input type="text" />
                            <FieldError />
                        </TextField>

                        <TextField
                            name="journalApproversGroup"
                            defaultValue={selectedItem?.journalApproversGroup}
                            className="col-span-4">
                            <Label>Kurátor AD</Label>
                            <Input type="text" />
                            <FieldError />
                        </TextField>

                        <TextField
                            name="journalReadGroup"
                            defaultValue={selectedItem?.journalReadGroup}
                            className="col-span-4">
                            <Label>View AD</Label>
                            <Input type="text" />
                            <FieldError />
                        </TextField>

                        <TextField
                            name="journalContributorGroup"
                            defaultValue={selectedItem?.journalContributorGroup}
                            className="col-span-4">
                            <Label>Editor AD</Label>
                            <Input type="text" />
                            <FieldError />
                        </TextField>

                        <input type='hidden' name='id' defaultValue={selectedItem?.id} />
                        <input type='hidden' name='parentId' defaultValue={selectedItem?.parentId}
                        />
                    </fieldset>

                    {changingValues && (
                        <div className="p-2 flex gap-2">
                            <Button
                                variant='default'
                                type="submit"
                                name="formAction"
                                value={mode}
                                size='sm'
                                isDisabled={fetcher.state !== 'idle'}>
                                Uložit
                            </Button>

                            {mode === 'edit' && (
                                <>
                                    <Button
                                        variant='destructive'
                                        isDisabled={fetcher.state !== 'idle'}
                                        size='sm'
                                        type="submit"
                                        name="formAction"
                                        value="delete">
                                        Smazat
                                    </Button>

                                    <Button variant='secondary'
                                        size='sm'
                                        isDisabled={fetcher.state !== 'idle'}
                                        onPressChange={() => {
                                            setChangingValues(false);
                                        }}>
                                        Zrušit
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                    <ItemListNavigation
                        currentItem={selectedItem}
                        items={outletContext.items}
                        getItemLink={(itm) => {
                            return `/records/org-hierarchy/workplaces/${outletContext.workplaceId}/districts/${itm.id}${location.search}`
                        }} />
                </FormValidationContext.Provider>
            </fetcher.Form>
        </Card>
    );
}