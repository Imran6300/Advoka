import { Inngest, EventSchemas } from "inngest";

type Events = {
  "document.uploaded": {
    data: {
      documentId: string;
      caseId: string;
      ownerId: string;
    };
  };
  "case.analyze.requested": {
    data: {
      caseId: string;
      ownerId: string;
    };
  };
  "case.graph.build": {
    data: {
      caseId: string;
      ownerId: string;
    };
  };
  "draft.generate.requested": {
    data: {
      draftId: string;
      caseId: string;
      ownerId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "advoka",
  schemas: new EventSchemas().fromRecord<Events>(),
});
