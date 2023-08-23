"use client";

import { useMemo, useState } from "react";
import { useCombobox, useMultipleSelection } from "downshift";
import { XIcon } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  options?: Option[];
  defaultSelected?: Option[];
  name?: string;
  onChange?: (event: { target: { value: Option[]; name: string } }) => void;
  createWhenNotExists?: boolean;
};

export function Autocomplete({
  onChange,
  createWhenNotExists,
  name = "autocomplete",
  options = [],
  defaultSelected = [],
}: Props) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<Option[]>(defaultSelected);

  const items = useMemo(() => {
    const search = value.toLocaleLowerCase();

    return options.filter(
      (option) =>
        !selected.find(({ value }) => {
          return value === option.value;
        }) &&
        (option.label.includes(search) || option.value.includes(search))
    );
  }, [selected, options, value]);

  const { removeSelectedItem, getSelectedItemProps, getDropdownProps } =
    useMultipleSelection({
      selectedItems: selected,
      onStateChange({ selectedItems: newSelectedItems = [], type }) {
        switch (type) {
          case useMultipleSelection.stateChangeTypes
            .SelectedItemKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
          case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
            if (onChange) {
              onChange({ target: { value: newSelectedItems, name } });
            }
            setSelected(newSelectedItems);
            break;
          default:
            break;
        }
      },
    });

  const {
    getInputProps,
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items:
      items.length <= 0 && createWhenNotExists
        ? [{ label: value, value }]
        : items,
    itemToString(item) {
      return item?.label ?? "";
    },
    defaultHighlightedIndex: 0,
    selectedItem: null,
    inputValue: value,
    stateReducer(_state, actionAndChanges) {
      const { changes, type } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true,
            highlightedIndex: 0,
          };
        default:
          return changes;
      }
    },
    onStateChange({ inputValue, type, selectedItem }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (selectedItem) {
            setSelected([...selected, selectedItem]);
            setValue("");
          }

          if (onChange && selectedItem) {
            onChange({ target: { value: [...selected, selectedItem], name } });
          }
          break;
        case useCombobox.stateChangeTypes.InputChange:
          setValue(inputValue ?? "");
          break;
        default:
          break;
      }
    },
  });

  return (
    <div className="w-full relative">
      <div className="w-full bg-white py-1 flex flex-wrap gap-2 border-b">
        {selected.map(function (selectedItemRender, index) {
          return (
            <span
              className="flex max-w-fit rounded-md items-center text-xs font-semibold bg-gray-50 text-gray-500"
              key={`selected-item-${index}`}
              {...getSelectedItemProps({
                selectedItem: selectedItemRender,
                index,
              })}
            >
              <span className="pl-2 pr-1">{selectedItemRender.label}</span>
              <button
                className="rounded-e-md hover:bg-gray-100 p-2 cursor-pointer"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSelectedItem(selectedItemRender);
                }}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </span>
          );
        })}

        <div className="w-full flex flex-1 justify-between">
          <input
            className="w-full outline-none h-8"
            {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
          />
          <button type="button" {...getToggleButtonProps()}>
            &#8595;
          </button>
        </div>
      </div>

      <ul
        className={`w-full min-w-[200px] bg-white border rounded-md p-1 max-w-max absolute transition-all opacity-0 translate-y-4 ${
          isOpen ? "opacity-100 translate-y-2" : ""
        }`}
        {...getMenuProps({
          style: {
            display:
              items.length <= 0 && (value.length <= 0 || !createWhenNotExists)
                ? "none"
                : "initial",
          },
        })}
      >
        {items.length <= 0 && value.length > 0 ? (
          <li
            {...getItemProps({ item: { label: value, value }, index: 0 })}
            className={`px-2 py-1 hover:bg-gray-50 text-sm text-gray-500 font-semibold cursor-pointer rounded-md ${
              highlightedIndex === 0 ? `bg-gray-50` : ""
            }`}
          >
            <span>criar {value}</span>
          </li>
        ) : null}

        {items.map((item, index) => (
          <li
            key={`${item.value}${index}`}
            {...getItemProps({ item, index })}
            className={`px-2 py-1 hover:bg-gray-50 text-sm text-gray-500 font-semibold cursor-pointer rounded-md ${
              highlightedIndex === index ? `bg-gray-50` : ""
            }`}
          >
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
