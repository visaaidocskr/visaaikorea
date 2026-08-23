import type { Locale } from "@/lib/i18n";

type LegalSection = { title: string; body: string };
type LegalCopy = {
  back: string;
  effective: string;
  termsTitle: string;
  refundTitle: string;
  privacyTitle: string;
  refundLink: string;
  contact: string;
  terms: LegalSection[];
  refunds: LegalSection[];
  privacy: LegalSection[];
};

// These policies are deliberately kept as reviewed human copy rather than
// machine-translated UI fragments.  It keeps legal wording consistent across
// the public site while the business details remain supplied separately.
export const LEGAL_COPY: Record<Locale, LegalCopy> = {
  en: {
    back: "Home", effective: "Effective", termsTitle: "Terms of Service", refundTitle: "Refund Policy", privacyTitle: "Privacy Policy", refundLink: "Read the Refund Policy →", contact: "Contact",
    terms: [
      { title: "Business information", body: "Vitamin Travel operates VisaAI Korea as an online visa-document and travel-support service." },
      { title: "Our service", body: "We prepare visa document packages and provide travel-support services, including quotation requests for flights and tours. We are not a government agency, embassy, consulate, immigration authority, airline, hotel, or insurer." },
      { title: "No guarantee of approval", body: "We prepare documents from information provided by the client. Visa approval is decided only by the embassy, consulate, or immigration authority. Our service does not guarantee visa approval." },
      { title: "Your responsibilities", body: "You are responsible for the accuracy of the information and documents you provide. False or incomplete information may lead to visa refusal and remains your responsibility." },
      { title: "Payment and refunds", body: "The service price and any official or third-party fee are shown or confirmed before payment. Payment, when available, is processed on an approved bank or payment partner’s secure page. We do not store full card numbers, CVV codes, card passwords, or bank login data." },
      { title: "Travel quotations and bookings", body: "A flight or tour request is not a booking. Prices and availability can change until confirmed in writing and, where relevant, a ticket or reservation is issued. We provide an exact offer before taking payment or confirming a booking." },
      { title: "Contact and complaints", body: "Contact us with your name and order reference. We aim to acknowledge service concerns within 5 business days." },
    ],
    refunds: [
      { title: "Before work begins", body: "If you cancel before our team begins document preparation, contact us promptly. Eligibility for a refund is assessed from the work already performed." },
      { title: "After work begins", body: "Document-preparation fees pay for professional work. Once preparation, review, translation, or document generation has begun, the service portion is normally non-refundable." },
      { title: "Embassy and third-party fees", body: "Embassy, insurance, airline, hotel, bank, and other third-party fees are governed by that provider’s terms. Amounts already paid to a third party cannot be refunded by us unless the provider returns them." },
      { title: "Visa outcome", body: "A visa refusal, delay, or different embassy decision does not by itself create a refund right. Visa decisions are made only by the relevant authority." },
      { title: "How to request a refund", body: "Email us with your full name, order or application reference, payment date, and the reason for your request. We will review it and reply with the outcome." },
    ],
    privacy: [
      { title: "Information we collect", body: "We collect account details, application information, travel plans, and the documents you choose to upload, such as your passport, ARC, and supporting files." },
      { title: "How we store it", body: "Uploaded documents are stored privately and are not public. Access is limited to you and authorised administrators who need it to prepare your documents. Download links are temporary." },
      { title: "How we use it", body: "We use your information only to prepare your document package and communicate about your application or requested travel service. We do not sell your personal data." },
      { title: "Who we share it with", body: "We share your information only where the service requires it: with the embassy or consulate you are applying to; with the licensed visa agents who submit Japan and Vietnam applications on your behalf; with the travel partners needed for a flight, hotel, insurance or tour you have requested; and with the providers that host our website, store files and deliver our emails. Each receives only what its task requires. We never sell or rent personal data." },
      { title: "How long we keep it", body: "We keep application data and uploaded files only for as long as we need them to prepare your documents, support your application and answer follow-up questions. You can ask us to delete your account and files at any time; we remove them unless a legal or accounting obligation requires a record to be kept, in which case we keep only what that obligation needs." },
      { title: "Payments", body: "When payments are available, card data is handled by the approved bank or payment partner on its secure page. We do not store full card numbers, CVV codes, card passwords, or bank login data." },
      { title: "Your choices", body: "You may request deletion of your account and associated files by contacting us. Some records may be retained when the law requires it." },
      { title: "Contact", body: "For a privacy question or deletion request, contact us and include enough information for us to identify your request safely." },
    ],
  },
  uz: {
    back: "Bosh sahifa", effective: "Amal qiladi", termsTitle: "Xizmat ko‘rsatish shartlari", refundTitle: "Qaytarish qoidasi", privacyTitle: "Maxfiylik siyosati", refundLink: "Qaytarish qoidasini o‘qish →", contact: "Aloqa",
    terms: [
      { title: "Kompaniya ma’lumoti", body: "Vitamin Travel VisaAI Korea onlayn visa-hujjat va sayohat yordami xizmatini yuritadi." },
      { title: "Bizning xizmatimiz", body: "Biz visa hujjatlari to‘plamini tayyorlaymiz va aviachipta hamda tur so‘rovlari kabi sayohat yordamlarini ko‘rsatamiz. Biz davlat organi, elchixona, konsullik, immigratsiya organi, aviakompaniya, mehmonxona yoki sug‘urta kompaniyasi emasmiz." },
      { title: "Visa chiqishi kafolatlanmaydi", body: "Hujjatlar mijoz bergan ma’lumot asosida tayyorlanadi. Visa qarorini faqat elchixona, konsullik yoki immigratsiya organi qabul qiladi. Xizmatimiz visa chiqishini kafolatlamaydi." },
      { title: "Sizning majburiyatlaringiz", body: "Kiritgan ma’lumotlaringiz va yuklagan hujjatlaringiz to‘g‘riligi uchun siz javobgarsiz. Noto‘g‘ri yoki to‘liq bo‘lmagan ma’lumot visa rad etilishiga olib kelishi mumkin." },
      { title: "To‘lov va qaytarish", body: "Xizmat narxi hamda rasmiy yoki uchinchi tomon to‘lovi to‘lovdan oldin ko‘rsatiladi yoki tasdiqlanadi. To‘lov mavjud bo‘lganda tasdiqlangan bank yoki payment hamkorining xavfsiz sahifasida amalga oshiriladi. Biz karta raqami, CVV, karta paroli yoki bank login ma’lumotlarini saqlamaymiz." },
      { title: "Aviabilet va tur so‘rovlari", body: "Aviabilet yoki tur so‘rovi bron emas. Narx va mavjudlik yozma tasdiqlanmaguncha, hamda kerak bo‘lsa chipta yoki bron rasmiylashtirilmaguncha o‘zgarishi mumkin. To‘lov yoki tasdiqlashdan oldin aniq taklif beramiz." },
      { title: "Aloqa va shikoyatlar", body: "Ismingiz va buyurtma yoki ariza raqamingiz bilan bizga yozing. Xizmat bo‘yicha murojaatni 5 ish kuni ichida qabul qilganimizni tasdiqlashga harakat qilamiz." },
    ],
    refunds: [
      { title: "Ish boshlanishidan oldin", body: "Jamoamiz hujjat tayyorlashni boshlashidan oldin bekor qilsangiz, tezda bizga murojaat qiling. Qaytarish imkoniyati bajarilgan ish hajmiga qarab baholanadi." },
      { title: "Ish boshlangandan keyin", body: "Hujjat tayyorlash to‘lovi professional mehnat uchun olinadi. Tayyorlash, tekshirish, tarjima yoki hujjat yaratish boshlanganidan keyin xizmat qismi odatda qaytarilmaydi." },
      { title: "Elchixona va uchinchi tomon to‘lovlari", body: "Elchixona, sug‘urta, aviakompaniya, mehmonxona, bank va boshqa uchinchi tomon to‘lovlariga ularning o‘z qoidalari amal qiladi. Uchinchi tomonga o‘tkazilgan summa ular qaytarmasa, biz tomonidan qaytarilmaydi." },
      { title: "Visa natijasi", body: "Visa rad etilishi, kechikishi yoki elchixonaning boshqa qarori o‘z-o‘zidan pul qaytarish huquqini bermaydi. Visa qarorini faqat tegishli organ qabul qiladi." },
      { title: "Qaytarishni qanday so‘rash mumkin", body: "To‘liq ism, buyurtma yoki ariza raqami, to‘lov sanasi va so‘rov sababini email orqali yuboring. So‘rovni ko‘rib chiqib, javob beramiz." },
    ],
    privacy: [
      { title: "Yig‘iladigan ma’lumotlar", body: "Biz akkaunt ma’lumotlari, ariza ma’lumotlari, sayohat rejalari hamda siz yuklagan pasport, ARC va boshqa tasdiqlovchi fayllarni yig‘amiz." },
      { title: "Saqlash tartibi", body: "Yuklangan hujjatlar yopiq saqlanadi va hammaga ochiq emas. Ularga faqat siz va hujjatingizni tayyorlash uchun zarur bo‘lgan vakolatli administratorlar kira oladi. Yuklab olish havolalari vaqtinchalik." },
      { title: "Ma’lumotdan foydalanish", body: "Ma’lumotingizdan faqat hujjatlar to‘plamini tayyorlash va ariza yoki so‘ralgan sayohat xizmati bo‘yicha bog‘lanish uchun foydalanamiz. Shaxsiy ma’lumotlaringizni sotmaymiz." },
      { title: "Kimlar bilan bo‘lishamiz", body: "Ma’lumotingizni faqat xizmat talab qilgan joyda bo‘lishamiz: ariza topshirayotgan elchixona yoki konsullik bilan; Yaponiya va Vyetnam arizalarini sizning nomingizdan topshiradigan litsenziyali viza agentlari bilan; so‘ragan aviachipta, mehmonxona, sug‘urta yoki tur uchun zarur sayohat hamkorlari bilan; hamda saytimizni joylashtiruvchi, fayllarni saqlovchi va xatlarimizni yetkazuvchi provayderlar bilan. Har biri faqat o‘z vazifasiga kerakli qismini oladi. Shaxsiy ma’lumotni hech qachon sotmaymiz va ijaraga bermaymiz." },
      { title: "Qancha muddat saqlaymiz", body: "Ariza ma’lumotlari va yuklangan fayllarni faqat hujjatlaringizni tayyorlash, arizangizni qo‘llab-quvvatlash va keyingi savollarga javob berish uchun zarur muddatgacha saqlaymiz. Istalgan vaqtda akkauntingiz va fayllaringizni o‘chirishni so‘rashingiz mumkin; qonuniy yoki buxgalteriya majburiyati yozuvni saqlashni talab qilmasa, ularni o‘chiramiz — talab qilsa, faqat shu majburiyatga kerakli qismini saqlaymiz." },
      { title: "To‘lovlar", body: "Onlayn to‘lov mavjud bo‘lganda, karta ma’lumotlari tasdiqlangan bank yoki payment hamkorining xavfsiz sahifasida qayta ishlanadi. Biz to‘liq karta raqami, CVV, karta paroli yoki bank loginini saqlamaymiz." },
      { title: "Sizning huquqlaringiz", body: "Bizga murojaat qilib akkauntingiz va bog‘langan fayllaringizni o‘chirishni so‘rashingiz mumkin. Qonun talab qilgan ayrim yozuvlar saqlanishi mumkin." },
      { title: "Aloqa", body: "Maxfiylik bo‘yicha savol yoki o‘chirish so‘rovi uchun bizga yozing. So‘rovingizni xavfsiz aniqlashimiz uchun yetarli ma’lumot kiriting." },
    ],
  },
  ru: {
    back: "Главная", effective: "Действует с", termsTitle: "Условия обслуживания", refundTitle: "Политика возврата", privacyTitle: "Политика конфиденциальности", refundLink: "Прочитать политику возврата →", contact: "Контакты",
    terms: [
      { title: "Информация о компании", body: "Vitamin Travel управляет VisaAI Korea как онлайн-сервисом подготовки визовых документов и поддержки путешествий." },
      { title: "Наш сервис", body: "Мы готовим комплекты визовых документов и оказываем поддержку путешествий, включая запросы цен на авиабилеты и туры. Мы не являемся государственным органом, посольством, консульством, иммиграционной службой, авиакомпанией, отелем или страховой компанией." },
      { title: "Одобрение визы не гарантируется", body: "Мы готовим документы по информации клиента. Решение о визе принимает только посольство, консульство или иммиграционный орган. Наш сервис не гарантирует одобрение визы." },
      { title: "Ваши обязанности", body: "Вы отвечаете за точность предоставленных данных и документов. Недостоверная или неполная информация может привести к отказу в визе." },
      { title: "Оплата и возврат", body: "Стоимость услуги и официальные или сторонние сборы показываются или подтверждаются до оплаты. При наличии оплаты она проходит на защищённой странице одобренного банка или платёжного партнёра. Мы не храним полные номера карт, CVV, пароли карт или банковские данные для входа." },
      { title: "Запросы авиабилетов и туров", body: "Запрос авиабилета или тура не является бронированием. Цена и наличие могут измениться до письменного подтверждения и, при необходимости, оформления билета или брони. До оплаты или подтверждения мы предоставляем точное предложение." },
      { title: "Связь и жалобы", body: "Напишите нам, указав имя и номер заказа или заявки. Мы стараемся подтвердить получение обращения в течение 5 рабочих дней." },
    ],
    refunds: [
      { title: "До начала работы", body: "Если вы отменяете заказ до начала подготовки документов нашей командой, свяжитесь с нами как можно скорее. Возможность возврата оценивается с учётом уже выполненной работы." },
      { title: "После начала работы", body: "Оплата подготовки документов покрывает профессиональную работу. После начала подготовки, проверки, перевода или формирования документов стоимость услуги обычно не возвращается." },
      { title: "Сборы посольства и третьих лиц", body: "К сборам посольства, страховщика, авиакомпании, отеля, банка и иных третьих лиц применяются их собственные правила. Суммы, уже перечисленные третьему лицу, не могут быть возвращены нами, если поставщик их не вернул." },
      { title: "Решение по визе", body: "Отказ, задержка или иное решение по визе сами по себе не дают права на возврат. Решение принимает только соответствующий орган." },
      { title: "Как запросить возврат", body: "Отправьте по email полное имя, номер заказа или заявки, дату оплаты и причину запроса. Мы рассмотрим обращение и сообщим решение." },
    ],
    privacy: [
      { title: "Какие данные мы собираем", body: "Мы собираем данные аккаунта, сведения заявки, планы поездки и файлы, которые вы решили загрузить: паспорт, ARC и подтверждающие документы." },
      { title: "Как мы храним данные", body: "Загруженные документы хранятся приватно и не являются общедоступными. Доступ есть только у вас и у уполномоченных администраторов, которым это необходимо для подготовки документов. Ссылки на скачивание временные." },
      { title: "Как мы используем данные", body: "Мы используем ваши данные только для подготовки пакета документов и связи по вашей заявке или запрошенной туристической услуге. Мы не продаём персональные данные." },
      { title: "С кем мы делимся данными", body: "Мы передаём ваши данные только там, где этого требует услуга: посольству или консульству, куда вы подаёте заявление; лицензированным визовым агентам, подающим заявления в Японию и Вьетнам от вашего имени; туристическим партнёрам, необходимым для запрошенного авиабилета, отеля, страховки или тура; а также провайдерам, которые размещают наш сайт, хранят файлы и доставляют наши письма. Каждый получает только то, что нужно для его задачи. Мы никогда не продаём и не сдаём в аренду персональные данные." },
      { title: "Сколько мы храним данные", body: "Данные заявления и загруженные файлы хранятся только столько, сколько нужно для подготовки документов, сопровождения заявления и ответов на последующие вопросы. Вы можете в любой момент попросить удалить аккаунт и файлы; мы удалим их, если только закон или бухгалтерские обязательства не требуют сохранить запись — тогда мы сохраняем лишь необходимое." },
      { title: "Оплата", body: "Когда онлайн-оплата доступна, данные карты обрабатываются одобренным банком или платёжным партнёром на его защищённой странице. Мы не храним полный номер карты, CVV, пароль карты или банковские данные для входа." },
      { title: "Ваш выбор", body: "Вы можете запросить удаление аккаунта и связанных файлов, связавшись с нами. Некоторые записи могут сохраняться, если этого требует закон." },
      { title: "Контакты", body: "По вопросам конфиденциальности или удаления напишите нам и укажите достаточно данных для безопасной идентификации запроса." },
    ],
  },
  ko: {
    back: "홈", effective: "시행일", termsTitle: "서비스 이용약관", refundTitle: "환불 정책", privacyTitle: "개인정보 처리방침", refundLink: "환불 정책 보기 →", contact: "문의",
    terms: [
      { title: "사업자 정보", body: "Vitamin Travel은 VisaAI Korea를 온라인 비자 서류 준비 및 여행 지원 서비스로 운영합니다." },
      { title: "서비스 범위", body: "당사는 비자 서류 패키지를 준비하고 항공권 및 여행 견적 요청을 포함한 여행 지원을 제공합니다. 당사는 정부 기관, 대사관, 영사관, 출입국 기관, 항공사, 호텔 또는 보험회사가 아닙니다." },
      { title: "비자 승인 보장 없음", body: "당사는 고객이 제공한 정보를 바탕으로 서류를 준비합니다. 비자 승인 여부는 대사관, 영사관 또는 출입국 기관만 결정합니다. 당사 서비스는 비자 승인을 보장하지 않습니다." },
      { title: "고객의 책임", body: "입력하고 제출한 정보 및 서류의 정확성은 고객의 책임입니다. 허위 또는 불완전한 정보는 비자 거절로 이어질 수 있습니다." },
      { title: "결제 및 환불", body: "서비스 요금과 공식 또는 제3자 수수료는 결제 전에 표시하거나 확인합니다. 결제가 제공되는 경우 승인된 은행 또는 결제 파트너의 보안 페이지에서 처리됩니다. 당사는 전체 카드 번호, CVV, 카드 비밀번호 또는 은행 로그인 정보를 저장하지 않습니다." },
      { title: "항공권 및 투어 견적", body: "항공권 또는 투어 요청은 예약이 아닙니다. 서면 확인 및 필요한 경우 티켓이나 예약 발급 전까지 가격과 이용 가능 여부가 변경될 수 있습니다. 결제나 예약 확정 전에 정확한 제안을 제공합니다." },
      { title: "문의 및 불만", body: "성명과 주문 또는 신청 번호를 포함해 문의해 주세요. 서비스 관련 문의는 5영업일 이내 접수 확인을 목표로 합니다." },
    ],
    refunds: [
      { title: "업무 시작 전", body: "팀이 서류 준비를 시작하기 전에 취소하는 경우 가능한 빨리 연락해 주세요. 환불 가능 여부는 이미 수행된 업무를 기준으로 검토합니다." },
      { title: "업무 시작 후", body: "서류 준비 수수료는 전문 업무에 대한 비용입니다. 준비, 검토, 번역 또는 문서 생성이 시작된 후에는 서비스 부분이 일반적으로 환불되지 않습니다." },
      { title: "대사관 및 제3자 수수료", body: "대사관, 보험, 항공사, 호텔, 은행 및 기타 제3자 수수료에는 각 제공자의 약관이 적용됩니다. 제3자에게 이미 지급된 금액은 해당 제공자가 반환하지 않는 한 당사가 환불할 수 없습니다." },
      { title: "비자 결과", body: "비자 거절, 지연 또는 다른 결정만으로 환불 권리가 생기지 않습니다. 비자 결정은 관련 기관만 내립니다." },
      { title: "환불 요청 방법", body: "성명, 주문 또는 신청 번호, 결제일, 요청 사유를 이메일로 보내 주세요. 검토 후 결과를 안내합니다." },
    ],
    privacy: [
      { title: "수집하는 정보", body: "당사는 계정 정보, 신청 정보, 여행 계획 및 여권, ARC, 증빙 파일 등 고객이 업로드하기로 선택한 서류를 수집합니다." },
      { title: "보관 방법", body: "업로드된 서류는 비공개로 보관되며 공개되지 않습니다. 고객 본인과 서류 준비를 위해 필요한 권한 있는 관리자만 접근할 수 있습니다. 다운로드 링크는 임시 링크입니다." },
      { title: "정보 이용", body: "당사는 서류 패키지 준비 및 신청 또는 요청한 여행 서비스 관련 소통을 위해서만 정보를 사용합니다. 개인정보를 판매하지 않습니다." },
      { title: "정보 공유 대상", body: "서비스에 필요한 경우에만 정보를 공유합니다: 신청하시는 대사관 또는 영사관, 일본·베트남 신청을 고객을 대신해 제출하는 등록된 비자 에이전트, 요청하신 항공권·호텔·보험·투어에 필요한 여행 파트너, 그리고 웹사이트 호스팅·파일 저장·이메일 발송을 담당하는 제공업체입니다. 각 대상은 업무에 필요한 정보만 받습니다. 개인정보를 판매하거나 대여하지 않습니다." },
      { title: "보관 기간", body: "신청 정보와 업로드된 파일은 서류 준비, 신청 지원 및 후속 문의 응대에 필요한 기간 동안만 보관합니다. 언제든지 계정과 파일 삭제를 요청할 수 있으며, 법적 또는 회계상 보관 의무가 없는 한 삭제합니다. 의무가 있는 경우 해당 의무에 필요한 최소한의 기록만 보관합니다." },
      { title: "결제", body: "온라인 결제가 제공될 때 카드 정보는 승인된 은행 또는 결제 파트너의 보안 페이지에서 처리됩니다. 당사는 전체 카드 번호, CVV, 카드 비밀번호 또는 은행 로그인 정보를 저장하지 않습니다." },
      { title: "고객의 선택", body: "연락을 통해 계정 및 연결 파일 삭제를 요청할 수 있습니다. 법령상 필요한 일부 기록은 보관될 수 있습니다." },
      { title: "문의", body: "개인정보 관련 문의 또는 삭제 요청은 안전하게 요청을 확인할 수 있는 정보를 포함해 연락해 주세요." },
    ],
  },
};
