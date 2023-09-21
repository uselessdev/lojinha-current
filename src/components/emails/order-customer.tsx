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

type Props = {
  store: string;
  order: {
    id: string;
    price: string;
    address: string;
    status: string;
    date: string;
  };
};

export const EmailOrderCustomer = ({
  store = "Acme Inc",
  order = {
    id: "12345",
    address:
      "Av. Rua, 1, Jardim Bairro - Cidade, BR - CEP: 11111-111 (Complemento)",
    price: "R$ 599,90",
    date: "20 de Setembro de 2023",
    status: "Aguardando Pagamento",
  },
}: Props) => {
  return (
    <Html>
      <Head />
      <Preview>Pedido Confirmado</Preview>

      <Tailwind>
        <Body className="mx-auto my-auto bg-zinc-50 font-sans">
          <Container className="max-w-2xl px-6">
            <Section className="py-10">
              <Heading className="text-lg text-zinc-600">
                Olá, seu pedido foi confirmado.
              </Heading>
              <Text>
                Agradecemos sua compra na <strong>{store}</strong>, enviamos
                este e-mail para dizer que seu pedido foi recebido com sucesso.
              </Text>
            </Section>

            <Hr />

            <Section>
              <Heading className="text-lg text-zinc-500">
                Detalhes do pedido:{" "}
                <span className="text-zinc-700">#{order.id.slice(0, 8)}</span>
              </Heading>
              <Text className="my-0 flex w-full justify-between">
                Valor: <strong>{order.price}</strong>
              </Text>
              <Text className="my-0 flex w-full justify-between">
                Endereço de entrega:{" "}
                <strong className="text-right">{order.address}</strong>
              </Text>
              <Text className="my-0 flex w-full justify-between">
                Data do pedido: <strong>{order.date}</strong>
              </Text>
              <Text className="my-1 flex justify-between">
                Status:{" "}
                <span className="rounded-md bg-zinc-100 p-1 text-zinc-600">
                  {order.status}
                </span>
              </Text>

              <Text>
                Você pode ver mais detalhes do seu pedido{" "}
                <Link href={`https://next.lojinha.dev/pedidos/${order.id}`}>
                  aqui
                </Link>
              </Text>
            </Section>

            <Hr />

            <Section>
              <Text className="text-center">
                &copy; Acme Inc, {new Date().getFullYear()}
              </Text>
              <Text className="text-center text-xs text-zinc-500">
                Você está recebendo este e-mail porque realizou uma compra em{" "}
                <Link href="https://next.lojinha.dev">Acme Inc</Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailOrderCustomer;
