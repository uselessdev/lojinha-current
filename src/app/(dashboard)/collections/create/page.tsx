import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CreateCollectionForm } from "../components/create-collection-form";

export default function CreateCollectionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Coleção</CardTitle>
      </CardHeader>

      <CardContent>
        <CreateCollectionForm />
      </CardContent>
    </Card>
  );
}
