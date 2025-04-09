import { type PropsWithChildren } from "react";
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import Image from "next/image";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type DropdownStyle = "classic" | "transparent";

type DropdownItemsProps<T extends string | number> = PropsWithChildren<{
  className?: string;
  choices: Record<T, string>;
  selectedType: T;
  setType: (type: T) => void;
  typesOverride?: readonly T[];
  style?: DropdownStyle;
  choiceImages?: Record<T, string>;
}>;
export const DropdownItems = <T extends string | number>({ className, choices, selectedType, setType, typesOverride, style = "classic", choiceImages }: DropdownItemsProps<T>) => {
  const types: readonly T[] = typesOverride ?? Object.keys(choices) as T[];
  return (
    <Menu as="div" className={`relative inline-block text-center ${className}`}>
      <div className="flex">
        <Menu.Button className={
          `${style === "classic" ? "inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer" : 
             style === "transparent" ? "inline-flex w-full justify-center items-center gap-x-1.5 pl-1 hover:opacity-90 cursor-pointer" :
            ""
          }`
        }>
          {style === "transparent" && choiceImages && 
            <Image
              src={choiceImages[selectedType]}
              alt=""
              width={32}
              height={32}
              className="pr-1"
            />
          }
          {choices[selectedType]}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className={
            `${style === "classic" ? "absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" : 
              style === "transparent" ? "absolute right-0 z-10 mt-2 w-48 origin-top-right bg-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" :
              ""
            }`
          }>
          <div className="py-1">
            {
              types.map(type => {
                return (
                  <Menu.Item key={type}>
                    <button
                      className={classNames(
                        `${style === "classic" ? `${
                            selectedType === type ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          }` : 
                          style === "transparent" ? "inline-flex w-full justify-center items-center gap-x-1.5 pl-1 hover:opacity-90" :
                          ""
                        }`,
                        `${style === "classic" ? "block w-full text-left px-4 py-2 text-sm" : 
                          style === "transparent" ? "block w-full text-left px-4 py-2 text-sm text-white" :
                          ""
                        }`,
                        "cursor-pointer"
                      )}
                      onClick={() => { setType(type) }}
                    >
                      {style === "transparent" && choiceImages && 
                        <Image
                          src={choiceImages[type]}
                          alt=""
                          width={32}
                          height={32}
                          className="pr-1"
                        />
                      }
                      { choices[type] }
                    </button>
                  </Menu.Item>
                );
              })
            }
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
