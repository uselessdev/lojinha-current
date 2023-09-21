import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
  Link,
} from "@react-email/components";
import { env } from "~/env.mjs";

type Props = {
  store: string;
  order: {
    id: string;
    customer: {
      id: string;
      email: string;
    };
    price: string;
    address: string;
    status: string;
    date: string;
  };
};

const BASE_URL =
  env.NODE_ENV !== "development"
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const EmailOrderStore = ({
  store = "Acme Inc",
  order = {
    id: "12345",
    address:
      "Av. Rua, 1, Jardim Bairro - Cidade, BR - CEP: 11111-111 (Complemento)",
    customer: { email: "customer@email.com", id: "12345" },
    price: "R$ 599,90",
    date: "20 de Setembro de 2023",
    status: "Aguardando Pagamento",
  },
}: Props) => {
  return (
    <Html>
      <Head />
      <Preview>Você tem um novo pedido na sua loja.</Preview>

      <Tailwind>
        <Body className="mx-auto my-auto bg-zinc-50 font-sans">
          <Container className="max-w-2xl px-6">
            <Section className="py-10">
              <Heading className="text-lg text-zinc-600">
                Olá, {store} tem um novo pedido.
              </Heading>
              <Text>
                Você acaba de receber um novo pedido na sua loja{" "}
                <strong>{store}</strong>.
              </Text>
            </Section>

            <Hr />

            <Section>
              <Heading className="text-lg text-zinc-500">
                Detalhes do pedido:{" "}
                <span className="text-zinc-700">#{order.id.slice(0, 8)}</span>
              </Heading>
              <Text className="my-0 flex justify-between">
                Email do cliente: <strong>{order.customer.email}</strong>
              </Text>
              <Text className="my-0 flex justify-between">
                Valor: <strong>{order.price}</strong>
              </Text>
              <Text className="my-0 flex justify-between">
                Endereço de entrega: <strong>{order.address}</strong>
              </Text>
              <Text className="my-0 flex justify-between">
                Data do pedido: <strong>{order.date}</strong>
              </Text>
              <Text className="my-1 flex justify-between">
                Status:{" "}
                <span className="rounded-md bg-zinc-100 p-1 text-zinc-600">
                  {order.status}
                </span>
              </Text>

              <Text>
                Você pode ver mais detalhes do pedido{" "}
                <Link
                  href={`${BASE_URL}/customers/${order.customer.id}/orders/${order.id}`}
                >
                  aqui
                </Link>
              </Text>
            </Section>

            <Hr />

            <Section>
              <Text className="text-center">
                &copy; lojinha.dev, {new Date().getFullYear()}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailOrderStore;
