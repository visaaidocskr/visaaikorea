// Marketing/display content for the landing country cards + slide-overs.
// Composed from the real rule engine (DESTINATION_RULES) so documents, embassy
// contacts, and processing notes never drift from the application logic.
// To add a new country: add it to DESTINATION_RULES, then add one entry here.
import { DESTINATION_RULES, type ContactCard } from "@/lib/visa/destinations";
import type { Locale } from "@/lib/i18n";

export type CountryContent = {
  /** Stable key used for localized marketing copy. */
  key: "japan" | "spain" | "taiwan" | "singapore" | "vietnam";
  country: string;
  flag: string;
  visaType: string;
  tagline: string;
  processingTime: string;
  overview: string;
  documents: string[];
  notes: string[];
  contacts: ContactCard[];
  /** Tailwind gradient classes for the card accent. */
  accent: string;
};

const DISPLAY: Record<
  string,
  {
    flag: string;
    visaType: string;
    tagline: string;
    processingTime: string;
    overview: string;
    notes: string[];
    accent: string;
  }
> = {
  Japan: {
    flag: "🇯🇵",
    visaType: "Tourist Visa",
    tagline: "Tokyo · Osaka · Fukuoka",
    processingTime: "About 7–10 days",
    overview:
      "We prepare your complete Japan tourist visa package — application form or information letter, a day-by-day itinerary, and a travel purpose statement — matched to the Busan sticker route or the eVISA route based on your address in Korea.",
    notes: [
      "Sticker route (Busan Consulate) submits the original passport through a designated agency.",
      "eVISA route does not require sending the original passport.",
      "Recommended bank balance: at least 5,000,000 KRW per applicant.",
      "Plan your stay between 1 and 15 days, 10–30 days after submission.",
    ],
    accent: "from-rose-500/15 to-red-500/5",
  },
  Spain: {
    flag: "🇪🇸",
    visaType: "Schengen Tourist Visa",
    tagline: "Madrid · Barcelona · Valencia",
    processingTime: "About 15 days (Schengen)",
    overview:
      "A full Schengen document package for residents of Korea: cover letter, itinerary, and a supporting checklist aligned with Embassy of Spain in Seoul guidance — including the travel-insurance and financial-proof requirements.",
    notes: [
      "Processed for applicants living in Korea with a valid ARC.",
      "Travel medical insurance covering the Schengen area is required.",
      "Choose a travel date at least 21 days after your appointment.",
    ],
    accent: "from-amber-500/15 to-orange-500/5",
  },
  Taiwan: {
    flag: "🇹🇼",
    visaType: "Tourist Visa",
    tagline: "Taipei · Taichung · Kaohsiung",
    processingTime: "About 10 working days",
    overview:
      "A Taiwan tourist visa package with itinerary and travel purpose statement, prepared for the Taipei Mission in Korea (Seoul or Busan office), including the 2026 bank-history checklist.",
    notes: [
      "The application form itself comes from Taiwan's official portal — we complete it there with your details and email you the barcoded form to sign. No other version of the form is accepted.",
      "Sticker visa — the original passport is held during processing.",
      "From 1 June 2026: include recent bank transaction history, not just a one-day balance.",
      "Keep your stay within 7 days for this service flow.",
    ],
    accent: "from-sky-500/15 to-blue-500/5",
  },
  Singapore: {
    flag: "🇸🇬",
    visaType: "Tourist Visa",
    tagline: "Singapore",
    processingTime: "A few working days",
    overview:
      "A clean, tourism-focused Singapore document package — Form 14A support, itinerary, and travel purpose statement — prepared for the by-appointment process at the Embassy in Seoul.",
    notes: [
      "Applications are by appointment only — no walk-ins.",
      "There are no authorised visa agents in Korea; we only prepare documents.",
      "Choose a travel date 10–30 days after your appointment.",
    ],
    accent: "from-violet-500/15 to-fuchsia-500/5",
  },
  Vietnam: {
    flag: "🇻🇳",
    visaType: "e-Visa",
    tagline: "Hanoi · Ho Chi Minh City · Da Nang",
    processingTime: "About 3–4 business days",
    overview:
      "A fully electronic Vietnam e-Visa — no embassy appointment, no original passport sent anywhere. We collect your data and the approved e-Visa (PDF) arrives by email, valid for 30 days from your entry date.",
    notes: [
      "Entirely online — no embassy visit required.",
      "Issued for 30 days; your return date is set automatically.",
      "Needs a 4×6 cm photo on a white background, plus a home-country family contact.",
    ],
    accent: "from-red-500/15 to-yellow-500/5",
  },
};

// Order shown on the landing page.
const ORDER = ["Japan", "Spain", "Taiwan", "Singapore", "Vietnam"];

export const COUNTRIES: CountryContent[] = ORDER.map((country) => {
  const d = DISPLAY[country];
  const rule = DESTINATION_RULES[country];
  return {
    key: country.toLowerCase() as CountryContent["key"],
    country,
    flag: d.flag,
    visaType: d.visaType,
    tagline: d.tagline,
    processingTime: d.processingTime,
    overview: d.overview,
    documents: rule?.documents ?? [],
    notes: d.notes,
    contacts: rule?.contacts ?? [],
    accent: d.accent,
  };
});

type LocalizedCountryCopy = Pick<
  CountryContent,
  "country" | "visaType" | "tagline" | "processingTime" | "overview" | "documents" | "notes"
>;

/**
 * Public-facing country-card copy. This is deliberately separate from the
 * rule engine: it translates explanations without changing official rules.
 */
const LOCALIZED_COUNTRY_COPY: Partial<Record<Exclude<Locale, "en">, Partial<Record<CountryContent["key"], LocalizedCountryCopy>>>> = {
  uz: {
    japan: {
      country: "Yaponiya",
      visaType: "Turist vizasi", tagline: "Tokio · Osaka · Fukuoka", processingTime: "Taxminan 7–10 kun",
      overview: "Yaponiya turist vizasi uchun to‘liq hujjatlar to‘plamini tayyorlaymiz: ariza shakli yoki ma’lumot xati, kunma-kun safar rejasi va safar maqsadi bayonoti. Koreyadagi manzilingizga qarab Busan stiker yo‘li yoki eVISA yo‘liga moslaymiz.",
      documents: ["Asl pasport", "Visa ariza shakli", "Yaqinda olingan 3.5 × 4.5 sm rasm", "Safar rejasi", "Aviabilet bron qilinishi", "Mehmonxona bron qilinishi", "ARC old va orqa tomoni", "Talaba yoki ish hujjati (Koreyadagi visa holatingizga qarab)", "Bank balansi sertifikati / 잔고증명서 (tavsiya: har bir arizachi uchun kamida 5 000 000 KRW)"],
      notes: ["Stiker yo‘li (Busan konsulligi): asl pasport belgilangan agentlik orqali topshiriladi.", "eVISA yo‘li: ko‘rsatma berilmasa, asl pasport yuborilmaydi.", "Tavsiya etilgan bank balansi: har bir arizachi uchun kamida 5 000 000 KRW.", "Safarni topshirishdan 10–30 kun keyinga, 1–15 kunlik muddatga rejalang."],
    },
    spain: {
      country: "Ispaniya",
      visaType: "Shengen turist vizasi", tagline: "Madrid · Barselona · Valensiya", processingTime: "Taxminan 15 kun (Shengen)",
      overview: "Koreya rezidentlari uchun to‘liq Shengen hujjatlar to‘plami: Ispaniyaning Seuldagi elchixonasi ko‘rsatmalariga mos cover letter, safar rejasi va yordamchi ro‘yxat. Unda sayohat sug‘urtasi va moliyaviy isbot talablari ham hisobga olinadi.",
      documents: ["Pasport", "Shengen visa ariza shakli", "Yaqinda olingan pasport rasmi", "Koreya ARC old/orqa tomoni", "Sayohat tibbiy sug‘urtasi", "Borib-kelish aviachiptasi bron qilinishi", "Mehmonxona bron qilinishi", "Kunlik safar rejasi", "Moliyaviy mablag‘ isboti / bank sertifikati / hisoboti", "Talaba yoki ish hujjati (Koreyadagi visa holatingizga qarab)", "Uchrashuv tasdiqnomasi", "Cover letter / safar maqsadi xati", "Koreyada yashash isboti (kerak bo‘lsa)"],
      notes: ["Xizmat Koreyada yashaydigan va amal qiluvchi ARCga ega arizachilar uchun.", "Shengen hududini qoplaydigan sayohat tibbiy sug‘urtasi talab qilinadi.", "Safar sanasini uchrashuvingizdan kamida 21 kun keyinga qo‘ying."],
    },
    taiwan: {
      country: "Tayvan",
      visaType: "Turist vizasi", tagline: "Taypey · Taichung · Kaohsiung", processingTime: "Taxminan 10 ish kuni",
      overview: "Tayvan turist vizasi uchun safar rejasi va safar maqsadi bayonotini tayyorlaymiz. Paket Koreyadagi Taypey Missiyasi (Seul yoki Busan ofisi) uchun 2026-yil bank tarixi ro‘yxatiga moslanadi.",
      documents: ["Asl pasport", "Ariza shakli", "Kunlik safar rejasi", "Uchrashuv tasdiqnomasi nusxasi", "Yaqinda olingan 3.5 × 4.5 sm rasm", "Bir kunlik bank balansi sertifikati (tavsiya: kamida 5 000 000 KRW) — Seul va Busan ofislari uchun", "Oxirgi 3 oylik bank tranzaksiyalari tarixi (oxirgi 10+ kun davomida kamida 5 000 000 KRW saqlangan) — faqat Seul ofisi uchun", "Talaba/ish hujjati (Koreyadagi visa holatingizga qarab)", "Borib-kelish aviachiptasi bron qilinishi", "Mehmonxona bron qilinishi"],
      notes: ["Rasmiy ariza Tayvanning rasmiy portalida to‘ldiriladi; biz ma’lumotlaringiz bilan tayyorlab, imzolash uchun shtrix-kodli shaklni emailga yuboramiz.", "Stiker viza — rasmiylashtirish vaqtida asl pasport topshiriladi.", "2026-yil 1-iyundan: faqat bir kunlik balans emas, so‘nggi tranzaksiyalar tarixi ham kerak.", "Bu xizmat oqimida safarni 7 kundan oshirmang."],
    },
    singapore: {
      country: "Singapur",
      visaType: "Turist vizasi", tagline: "Singapur", processingTime: "Bir necha ish kuni",
      overview: "Singapur uchun turizmga yo‘naltirilgan tartibli hujjatlar to‘plami: Form 14A bo‘yicha yordam, safar rejasi va safar maqsadi bayonoti. Seuldagi elchixonaning uchrashuv asosidagi jarayoniga tayyorlanadi.",
      documents: ["Asl pasport", "Form 14A", "Kunlik safar rejasi", "Uchrashuv tasdiqnomasi", "Yaqinda olingan 3.5 × 4.5 sm rasm", "Bank balansi sertifikati (tavsiya: kamida 5 000 000 KRW)", "Talaba/ish hujjati (Koreyadagi visa holatingizga qarab)", "Borib-kelish aviachiptasi bron qilinishi", "Mehmonxona bron qilinishi", "Form V39A / Letter of Introduction (fuqarolik yoki holatga qarab talab qilinishi mumkin)"],
      notes: ["Arizalar faqat uchrashuv bilan qabul qilinadi; walk-in yo‘q.", "Koreyada vakolatli visa agentlari yo‘q; biz faqat hujjat tayyorlaymiz.", "Safar sanasini uchrashuvdan 10–30 kun keyinga qo‘ying."],
    },
    vietnam: {
      country: "Vyetnam",
      visaType: "e-Visa", tagline: "Hanoi · Ho Chi Minh City · Da Nang", processingTime: "Taxminan 3–4 ish kuni",
      overview: "To‘liq elektron Vietnam e-Visa: elchixona uchrashuvi ham, asl pasportni yuborish ham kerak emas. Ma’lumotlaringizni yig‘amiz va tasdiqlangan e-Visa PDF ko‘rinishida emailga keladi; kirish sanasidan 30 kun amal qiladi.",
      documents: ["Pasport nusxasi", "Koreya ARC — old va orqa tomoni", "Oq fonda 4 × 6 sm yaqinda olingan rasm", "Vataningizdagi oila a’zosining to‘liq ismi, telefoni va manzili", "Vyetnamdagi rejalashtirilgan xarajat (USD)", "Safarni kim moliyalashtirishi"],
      notes: ["Butun jarayon onlayn — elchixonaga borish shart emas.", "30 kunga beriladi; qaytish sanasi avtomatik belgilanadi.", "Oq fondagi 4×6 sm rasm va vatandagi oila a’zosi kontakti kerak."],
    },
  },
  ru: {
    japan: {
      country: "Япония",
      visaType: "Туристическая виза", tagline: "Токио · Осака · Фукуока", processingTime: "Около 7–10 дней",
      overview: "Мы готовим полный пакет документов для туристической визы в Японию: анкету или информационное письмо, маршрут по дням и заявление о цели поездки. Пакет подбирается под маршрут со стикером через Пусан или eVISA в зависимости от вашего адреса в Корее.",
      documents: ["Оригинал паспорта", "Визовая анкета", "Недавняя фотография 3,5 × 4,5 см", "Маршрут поездки", "Бронь авиабилета", "Бронь отеля", "ARC: лицевая и обратная стороны", "Справка из университета или с работы (по статусу визы в Корее)", "Справка о балансе / 잔고증명서 (рекомендуется не менее 5 000 000 KRW на заявителя)"],
      notes: ["Маршрут со стикером (консульство Пусана): оригинал паспорта подаётся через назначенное агентство.", "Для eVISA оригинал паспорта не отправляется, если это не указано отдельно.", "Рекомендуемый остаток на счёте: не менее 5 000 000 KRW на заявителя.", "Планируйте поездку через 10–30 дней после подачи, на срок от 1 до 15 дней."],
    },
    spain: {
      country: "Испания",
      visaType: "Туристическая шенгенская виза", tagline: "Мадрид · Барселона · Валенсия", processingTime: "Около 15 дней (Шенген)",
      overview: "Полный пакет шенгенских документов для резидентов Кореи: сопроводительное письмо, маршрут и вспомогательный чек-лист по требованиям Посольства Испании в Сеуле, включая требования к страховке и финансовым документам.",
      documents: ["Паспорт", "Анкета на шенгенскую визу", "Недавняя фотография на паспорт", "Корейская ARC: лицевая и обратная стороны", "Медицинская страховка для поездки", "Бронь билета туда и обратно", "Бронь отеля", "Маршрут по дням", "Подтверждение финансовых средств / справка или выписка из банка", "Справка из университета или с работы (по статусу визы в Корее)", "Подтверждение записи", "Сопроводительное письмо / письмо о цели поездки", "Подтверждение проживания в Корее (при необходимости)"],
      notes: ["Сервис предназначен для заявителей, живущих в Корее с действующей ARC.", "Требуется туристическая медицинская страховка, покрывающая Шенгенскую зону.", "Выберите дату поездки минимум через 21 день после записи."],
    },
    taiwan: {
      country: "Тайвань",
      visaType: "Туристическая виза", tagline: "Тайбэй · Тайчжун · Гаосюн", processingTime: "Около 10 рабочих дней",
      overview: "Пакет для туристической визы на Тайвань с маршрутом и заявлением о цели поездки, подготовленный для Тайбэйской миссии в Корее (офис в Сеуле или Пусане) с учётом банковского чек-листа 2026 года.",
      documents: ["Оригинал паспорта", "Анкета", "План поездки по дням", "Распечатка подтверждения записи", "Недавняя фотография 3,5 × 4,5 см", "Справка о балансе за один день (рекомендуется не менее 5 000 000 KRW) — для офисов Сеула и Пусана", "История банковских операций за последние 3 месяца (баланс не менее 5 000 000 KRW в течение последних 10+ дней) — только для подачи через Сеул", "Справка из университета/с работы (по статусу визы в Корее)", "Бронь билета туда и обратно", "Бронь отеля"],
      notes: ["Официальная анкета заполняется на портале Тайваня; мы оформляем её с вашими данными и отправляем штрихкодированную форму для подписи по email.", "Стикерная виза: оригинал паспорта находится у офиса на время рассмотрения.", "С 1 июня 2026 года нужна не только справка об остатке, но и недавняя история операций.", "В рамках этой услуги планируйте пребывание не более 7 дней."],
    },
    singapore: {
      country: "Сингапур",
      visaType: "Туристическая виза", tagline: "Сингапур", processingTime: "Несколько рабочих дней",
      overview: "Аккуратный туристический пакет для Сингапура: помощь с Form 14A, маршрут и заявление о цели поездки, подготовленные для процесса по записи в Посольстве в Сеуле.",
      documents: ["Оригинал паспорта", "Form 14A", "Маршрут по дням", "Подтверждение записи", "Недавняя фотография 3,5 × 4,5 см", "Справка о балансе (рекомендуется не менее 5 000 000 KRW)", "Справка из университета/с работы (по статусу визы в Корее)", "Бронь билета туда и обратно", "Бронь отеля", "Form V39A / Letter of Introduction (может требоваться в зависимости от гражданства или ситуации)"],
      notes: ["Заявления принимаются только по записи; без записи приёма нет.", "В Корее нет уполномоченных визовых агентов; мы только готовим документы.", "Выберите дату поездки через 10–30 дней после записи."],
    },
    vietnam: {
      country: "Вьетнам",
      visaType: "e-Visa", tagline: "Ханой · Хошимин · Дананг", processingTime: "Около 3–4 рабочих дней",
      overview: "Полностью электронная e-Visa во Вьетнам: не требуется запись в посольство и отправка оригинала паспорта. Мы собираем ваши данные, а одобренная e-Visa в PDF приходит по email и действует 30 дней с даты въезда.",
      documents: ["Копия паспорта", "Корейская ARC: лицевая и обратная стороны", "Недавняя фотография 4 × 6 см на белом фоне", "Полное имя, телефон и адрес члена семьи в вашей стране", "Планируемые расходы во Вьетнаме (USD)", "Кто финансирует поездку"],
      notes: ["Весь процесс проходит онлайн — посещение посольства не нужно.", "Выдаётся на 30 дней; дата возвращения устанавливается автоматически.", "Нужна фотография 4×6 см на белом фоне и контакт члена семьи в вашей стране."],
    },
  },
  ko: {
    japan: {
      country: "일본",
      visaType: "관광 비자", tagline: "도쿄 · 오사카 · 후쿠오카", processingTime: "약 7–10일",
      overview: "일본 관광 비자용 전체 서류 패키지를 준비합니다. 신청서 또는 정보 안내문, 일자별 일정표, 여행 목적서를 포함하며 한국 내 주소에 따라 부산 스티커 경로 또는 eVISA 경로에 맞춥니다.",
      documents: ["여권 원본", "비자 신청서", "최근 촬영한 3.5 × 4.5cm 사진", "여행 일정표", "항공권 예약", "호텔 예약", "ARC 앞면 및 뒷면", "재학 또는 재직 서류(한국 비자 상태에 따라)", "잔고증명서(신청인 1인당 최소 5,000,000KRW 권장)"],
      notes: ["스티커 경로(부산 영사관)는 지정된 여행사를 통해 여권 원본을 제출합니다.", "eVISA 경로는 별도 안내가 없는 한 여권 원본을 보내지 않습니다.", "권장 은행 잔고: 신청인 1인당 최소 5,000,000KRW.", "제출일로부터 10–30일 후, 1–15일 체류로 여행을 계획하세요."],
    },
    spain: {
      country: "스페인",
      visaType: "쉥겐 관광 비자", tagline: "마드리드 · 바르셀로나 · 발렌시아", processingTime: "약 15일(쉥겐)",
      overview: "한국 거주자를 위한 완전한 쉥겐 서류 패키지입니다. 주한 스페인 대사관 안내에 맞춘 커버레터, 일정표 및 보조 체크리스트를 제공하며 여행 보험과 재정 증빙 요건을 포함합니다.",
      documents: ["여권", "쉥겐 비자 신청서", "최근 여권 사진", "한국 ARC 앞면/뒷면", "여행자 의료보험", "왕복 항공권 예약", "호텔 예약", "일자별 여행 일정", "재정 증명 / 은행 잔고증명서 / 거래내역서", "재학 또는 재직 서류(한국 비자 상태에 따라)", "예약 확인서", "커버레터 / 여행 목적서", "한국 거주 증명(필요한 경우)"],
      notes: ["이 서비스는 유효한 ARC를 소지하고 한국에 거주하는 신청인을 위한 것입니다.", "쉥겐 지역을 보장하는 여행자 의료보험이 필요합니다.", "예약일로부터 최소 21일 이후의 여행일을 선택하세요."],
    },
    taiwan: {
      country: "대만",
      visaType: "관광 비자", tagline: "타이베이 · 타이중 · 가오슝", processingTime: "약 10영업일",
      overview: "여행 일정과 여행 목적서를 포함한 대만 관광 비자 패키지입니다. 2026년 은행 거래내역 체크리스트에 맞춰 주한 타이베이 대표부(서울 또는 부산 사무소)용으로 준비합니다.",
      documents: ["여권 원본", "신청서", "일자별 여행 계획", "예약 확인서 출력본", "최근 촬영한 3.5 × 4.5cm 사진", "1일 기준 잔고증명서(최소 5,000,000KRW 권장) — 서울·부산 사무소 모두 필요", "최근 3개월 은행 거래내역(최근 10일 이상 5,000,000KRW 이상 유지) — 서울 사무소 제출 시에만 필요", "재학/재직 서류(한국 비자 상태에 따라)", "왕복 항공권 예약", "호텔 예약"],
      notes: ["공식 신청서는 대만 공식 포털에서 작성합니다. 당사가 고객 정보로 작성 후 서명을 위한 바코드 양식을 이메일로 보냅니다.", "스티커 비자는 심사 중 여권 원본을 제출합니다.", "2026년 6월 1일부터 잔고증명서뿐 아니라 최근 거래내역도 필요합니다.", "이 서비스에서는 체류 기간을 7일 이내로 계획하세요."],
    },
    singapore: {
      country: "싱가포르",
      visaType: "관광 비자", tagline: "싱가포르", processingTime: "수 영업일",
      overview: "싱가포르 관광용 정리된 서류 패키지입니다. Form 14A 지원, 일정표, 여행 목적서를 포함하며 주한 싱가포르 대사관의 예약 기반 절차에 맞춰 준비합니다.",
      documents: ["여권 원본", "Form 14A", "일자별 여행 계획", "예약 확인서", "최근 촬영한 3.5 × 4.5cm 사진", "잔고증명서(최소 5,000,000KRW 권장)", "재학/재직 서류(한국 비자 상태에 따라)", "왕복 항공권 예약", "호텔 예약", "Form V39A / Letter of Introduction(국적 또는 상황에 따라 필요할 수 있음)"],
      notes: ["신청은 예약제로만 접수되며 방문 접수는 불가합니다.", "한국에는 공인 비자 대행사가 없으며, 당사는 서류만 준비합니다.", "예약일로부터 10–30일 후의 여행일을 선택하세요."],
    },
    vietnam: {
      country: "베트남",
      visaType: "e-Visa", tagline: "하노이 · 호찌민시 · 다낭", processingTime: "약 3–4영업일",
      overview: "완전 전자식 베트남 e-Visa입니다. 대사관 예약이나 여권 원본 발송이 필요 없습니다. 정보를 수집하면 승인된 e-Visa PDF가 이메일로 도착하며 입국일로부터 30일간 유효합니다.",
      documents: ["여권 사본", "한국 ARC 앞면 및 뒷면", "흰색 배경의 최근 4 × 6cm 사진", "본국 가족 구성원의 성명, 전화번호 및 주소", "베트남에서의 예상 지출(USD)", "여행 경비 부담자"],
      notes: ["전 과정이 온라인으로 진행되어 대사관 방문이 필요 없습니다.", "30일 체류로 발급되며 귀국일은 자동 계산됩니다.", "흰색 배경의 4×6cm 사진과 본국 가족 연락처가 필요합니다."],
    },
  },
};

/**
 * Marketing copy is intentionally kept separate from the embassy rule data.
 * This lets the public country cards change language without translating or
 * mutating the underlying route rules used by the application workflow.
 */
export function localizeCountryContent(country: CountryContent, locale: Locale): CountryContent {
  const copy = locale === "en" ? undefined : LOCALIZED_COUNTRY_COPY[locale]?.[country.key];
  return copy ? { ...country, ...copy } : country;
}
