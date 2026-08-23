import type { Metadata } from "next";
import { ServicesPage } from "./ServicesPage";

export const metadata: Metadata = {
  title: "Services & prices",
  description:
    "Transparent visa document preparation prices for Japan, Taiwan, Singapore, Vietnam and Spain, plus flight and tour quotations — for foreigners living in Korea.",
};

export default function Page() {
  return <ServicesPage />;
}
