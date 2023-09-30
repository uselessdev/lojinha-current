export default function Home() {
  return (
    <section className="flex w-full max-w-2xl flex-col gap-6 [text-wrap:balance]">
      <h2 className="text-4xl font-black md:text-7xl">
        Desenvolva seu e-commerce de forma rápida.
      </h2>
      <p className="text-md md:text-lg">
        Lojinha é uma plataforma de e-commerce{" "}
        <strong className="underline decoration-wavy decoration-2 underline-offset-2">
          headless
        </strong>
        , nós fornecemos a plataforma e você se preocupa com a experiência do
        seu cliente.
      </p>
    </section>
  );
}
