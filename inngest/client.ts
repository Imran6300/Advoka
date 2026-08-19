import { Inngest, EventSchemas } from "inngest";

type Events = {
  "document.uploaded": {
    data: {
      documentId: string;
      caseId: string;
      ownerId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "advoka",
  schemas: new EventSchemas().fromRecord<Events>(),
});
