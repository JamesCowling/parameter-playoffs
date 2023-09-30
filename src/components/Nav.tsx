import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default function Nav() {
  const location = useLocation();

  const links = [
    { title: "Vote", path: "/" },
    { title: "Stats", path: "/stats" },
    { title: "Prompts", path: "/prompts" },
  ];

  return (
    <div>
      <NavigationMenu>
        <NavigationMenuList>
          {links.map((link) => (
            <NavigationMenuItem>
              <Link to={link.path}>
                <NavigationMenuLink
                  active={location.pathname === link.path}
                  className={navigationMenuTriggerStyle()}
                >
                  {link.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
