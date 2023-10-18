import { Trash2Icon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { FormField, FormItem } from "~/components/ui/form";
import { Input } from "~/components/ui/input";

export function VariantValues(props: { index: number }) {
  const { control, setValue } = useFormContext();

  const values = useFieldArray({
    control,
    name: `variants[${props.index}].options`,
  });

  return (
    <div className="space-y-2">
      {values.fields.map((field, index) => (
        <FormField
          key={field.id}
          name={`variants[${props.index}].options[${index}]`}
          render={({ field: option }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <Input
                {...option}
                onChange={({ target }) => {
                  setValue(
                    `variants.${props.index}.options[${index}]`,
                    target.value,
                  );
                  setValue(`options.${index}.name`, target.value);
                }}
                onBlur={(event) => {
                  if (event.target.value.length <= 0) {
                    values.remove(index);
                  } else {
                    values.append("");
                  }
                }}
              />
              <Button
                variant="ghost"
                onClick={() => values.remove(index)}
                className="mt-0"
              >
                <Trash2Icon />
              </Button>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
