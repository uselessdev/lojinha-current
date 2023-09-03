import {
  HomeIcon,
  KeyRoundIcon,
  LayersIcon,
  NewspaperIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TagIcon,
  WebhookIcon,
} from "lucide-react";
import { type ReactElement } from "react";

export const menu: Array<{
  icon: ReactElement;
  label: string;
  url: __next_route_internal_types__.StaticRoutes;
}> = [
  {
    url: `/dashboard`,
    label: `Página Inicial`,
    icon: <HomeIcon className="text-current" />,
  },
  {
    url: `/collections`,
    label: `Coleções`,
    icon: <LayersIcon className="text-current" />,
  },
  {
    url: `/products`,
    label: "Produtos",
    icon: <TagIcon className="text-current" />,
  },
  {
    url: `/carts`,
    label: "Carrinhos",
    icon: <ShoppingCartIcon className="text-current" />,
  },
  // {
  //   url: `/orders`,
  //   label: "Pedidos",
  //   icon: <BoxIcon className="text-current" />,
  // },
  {
    url: `/keys`,
    label: `Chaves de API`,
    icon: <KeyRoundIcon className="text-current" />,
  },
  {
    url: `/events`,
    label: `Eventos`,
    icon: <NewspaperIcon className="text-current" />,
  },
  {
    url: "/store-webhooks",
    label: "Webhooks",
    icon: <WebhookIcon className="text-current" />,
  },
  {
    url: `/settings`,
    label: `Configurações`,
    // disabled: true,
    icon: <SettingsIcon className="text-current" />,
  },
];
