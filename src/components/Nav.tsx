import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

export default function Nav() {
  const location = useLocation();

  const currentClassLarge = (path: string) => {
    return location.pathname === path
      ? "border-indigo-500 text-gray-900"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700";
  };

  const currentClassSmall = (path: string) => {
    return location.pathname === path
      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700";
  };

  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                    alt="Your Company" // XXX change this
                  />
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentClassLarge(
                      "/"
                    )}`}
                  >
                    Vote
                  </Link>
                  <Link
                    to="/stats"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentClassLarge(
                      "/stats"
                    )}`}
                  >
                    Stats
                  </Link>
                  <Link
                    to="/prompts"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentClassLarge(
                      "/prompts"
                    )}`}
                  >
                    Prompts
                  </Link>
                  <Link
                    to="/hof"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${currentClassLarge(
                      "/hof"
                    )}`}
                  >
                    Hall of Fame
                  </Link>
                </div>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {/* Current: "", Default: "" */}
              <Disclosure.Button
                as="a"
                href="/"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${currentClassSmall(
                  "/"
                )}`}
              >
                Vote
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="/stats"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${currentClassSmall(
                  "/stats"
                )}`}
              >
                Stats
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="/prompts"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${currentClassSmall(
                  "/prompts"
                )}`}
              >
                Prompts
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="/hof"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${currentClassSmall(
                  "/hof"
                )}`}
              >
                Hall of Fame
              </Disclosure.Button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
