import type { Locale } from "@/lib/i18n/types";
import type { SiteInfoSection } from "@/components/SiteInfoPage";

type PageCopy = {
  title: string;
  intro: string;
  updatedLabel: string;
  sections: SiteInfoSection[];
};

function withPlatform(template: string, platformName: string) {
  return template.replaceAll("{platform}", platformName);
}

export function getPrivacyPolicyCopy(locale: Locale, platformName: string): PageCopy {
  if (locale === "en") {
    return {
      title: "Privacy Policy",
      intro: withPlatform(
        "This Privacy Policy explains how {platform} collects, uses, and protects your personal information when you use our website and learning services.",
        platformName,
      ),
      updatedLabel: "Last updated: September 2026",
      sections: [
        {
          heading: "1. Information we collect",
          paragraphs: [
            "We collect information you provide when you create an account, enroll in courses, purchase products or subscriptions, contact support, or use platform features.",
          ],
          bullets: [
            "Account details such as name, email, and phone number",
            "Learning activity such as course progress, quiz attempts, ratings, and certificates",
            "Payment and balance-related records needed to process purchases",
            "Technical data such as device/browser information and basic usage logs for security and performance",
          ],
        },
        {
          heading: "2. How we use your information",
          paragraphs: [
            "We use your information to operate and improve the platform, deliver courses, issue certificates, process payments, provide support, and keep accounts secure.",
          ],
          bullets: [
            "Create and manage your account",
            "Provide course access, quizzes, certificates, and related learning features",
            "Communicate about account activity, purchases, and important service updates",
            "Prevent fraud, abuse, and unauthorized access",
          ],
        },
        {
          heading: "3. Sharing of information",
          paragraphs: [
            "We do not sell your personal information. We may share limited data with trusted service providers that help us run the platform (for example hosting, video delivery, or payment confirmation workflows), only as needed to provide the service.",
            "We may also disclose information if required by law or to protect the rights, safety, and integrity of users and the platform.",
          ],
        },
        {
          heading: "4. Data retention and security",
          paragraphs: [
            "We retain account and learning records for as long as needed to provide the service and meet legal or operational requirements. We apply reasonable technical and organizational measures to protect your data, but no online system can be guaranteed 100% secure.",
          ],
        },
        {
          heading: "5. Your choices",
          paragraphs: [
            "You may update account information from your profile where available. You may contact us to request support related to your data. Some information must be kept to maintain course access records, certificates, and transaction history.",
          ],
        },
        {
          heading: "6. Contact",
          paragraphs: [
            withPlatform(
              "If you have questions about this Privacy Policy, please reach us through the Contact page on {platform}.",
              platformName,
            ),
          ],
        },
      ],
    };
  }

  return {
    title: "سياسة الخصوصية",
    intro: withPlatform(
      "توضح سياسة الخصوصية هذه كيف تجمع منصة {platform} معلوماتك الشخصية وتستخدمها وتحميها عند استخدامك للموقع وخدمات التعلم.",
      platformName,
    ),
    updatedLabel: "آخر تحديث: سبتمبر 2026",
    sections: [
      {
        heading: "1. المعلومات التي نجمعها",
        paragraphs: [
          "نجمع المعلومات التي تقدمها عند إنشاء حساب، أو التسجيل في الدورات، أو شراء المنتجات أو الاشتراكات، أو التواصل مع الدعم، أو استخدام ميزات المنصة.",
        ],
        bullets: [
          "بيانات الحساب مثل الاسم والبريد الإلكتروني ورقم الهاتف",
          "نشاط التعلم مثل تقدم الدورات ومحاولات الاختبارات والتقييمات والشهادات",
          "سجلات الدفع والرصيد اللازمة لمعالجة عمليات الشراء",
          "بيانات تقنية مثل معلومات الجهاز/المتصفح وسجلات الاستخدام الأساسية للأمان والأداء",
        ],
      },
      {
        heading: "2. كيف نستخدم معلوماتك",
        paragraphs: [
          "نستخدم معلوماتك لتشغيل المنصة وتحسينها، وتقديم الدورات، وإصدار الشهادات، ومعالجة المدفوعات، وتقديم الدعم، والحفاظ على أمان الحسابات.",
        ],
        bullets: [
          "إنشاء حسابك وإدارته",
          "توفير الوصول إلى الدورات والاختبارات والشهادات وميزات التعلم ذات الصلة",
          "التواصل بشأن نشاط الحساب والمشتريات وتحديثات الخدمة المهمة",
          "منع الاحتيال وسوء الاستخدام والوصول غير المصرح به",
        ],
      },
      {
        heading: "3. مشاركة المعلومات",
        paragraphs: [
          "نحن لا نبيع معلوماتك الشخصية. قد نشارك بيانات محدودة مع مزودي خدمات موثوقين يساعدوننا في تشغيل المنصة (مثل الاستضافة أو بث الفيديو أو تأكيد الدفع)، وذلك بالقدر اللازم فقط لتقديم الخدمة.",
          "قد نفصح أيضاً عن المعلومات إذا تطلب القانون ذلك أو لحماية حقوق وسلامة المستخدمين والمنصة.",
        ],
      },
      {
        heading: "4. الاحتفاظ بالبيانات والأمان",
        paragraphs: [
          "نحتفظ بسجلات الحساب والتعلم طالما كان ذلك ضرورياً لتقديم الخدمة والوفاء بالمتطلبات القانونية أو التشغيلية. نطبق تدابير تقنية وتنظيمية معقولة لحماية بياناتك، لكن لا يمكن ضمان أمان أي نظام إلكتروني بنسبة 100%.",
        ],
      },
      {
        heading: "5. خياراتك",
        paragraphs: [
          "يمكنك تحديث بيانات الحساب من ملفك الشخصي حيثما كان ذلك متاحاً. يمكنك التواصل معنا لطلب الدعم المتعلق ببياناتك. قد يلزم الاحتفاظ ببعض المعلومات للحفاظ على سجلات الوصول إلى الدورات والشهادات وسجل المعاملات.",
        ],
      },
      {
        heading: "6. التواصل",
        paragraphs: [
          withPlatform(
            "إذا كانت لديك أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر صفحة اتصل بنا في {platform}.",
            platformName,
          ),
        ],
      },
    ],
  };
}

export function getTermsCopy(locale: Locale, platformName: string): PageCopy {
  if (locale === "en") {
    return {
      title: "Terms and Conditions",
      intro: withPlatform(
        "By accessing or using {platform}, you agree to these Terms and Conditions. Please read them carefully before creating an account or purchasing any course or product.",
        platformName,
      ),
      updatedLabel: "Last updated: September 2026",
      sections: [
        {
          heading: "1. Acceptance of terms",
          paragraphs: [
            withPlatform(
              "These terms govern your use of the {platform} website, courses, store products, subscriptions, and related services. If you do not agree, you should not use the platform.",
              platformName,
            ),
          ],
        },
        {
          heading: "2. Accounts",
          paragraphs: [
            "You are responsible for keeping your login details secure and for all activity under your account. You must provide accurate registration information and notify us if you suspect unauthorized access.",
            "We may suspend or terminate accounts that violate these terms, abuse the platform, share access improperly, or attempt to bypass security controls.",
          ],
        },
        {
          heading: "3. Courses and digital content",
          paragraphs: [
            "Course access, duration, quizzes, certificates, and related features are provided as described on each course page or in your dashboard. Unless otherwise stated, purchased content is licensed for personal learning use only and may not be copied, redistributed, recorded, or shared publicly.",
          ],
          bullets: [
            "Do not share account credentials with others",
            "Do not download, redistribute, or re-sell course materials unless explicitly allowed",
            "Certificate eligibility depends on completing the required course conditions",
          ],
        },
        {
          heading: "4. Payments and pricing",
          paragraphs: [
            "Prices are shown in the platform currency and may change over time. Purchases, wallet top-ups, and subscriptions become available after successful payment confirmation according to the methods offered on the platform.",
          ],
        },
        {
          heading: "5. Acceptable use",
          paragraphs: [
            "You agree not to misuse the platform, interfere with other users, attempt unauthorized access, upload harmful content, or use the service for unlawful purposes.",
          ],
        },
        {
          heading: "6. Intellectual property",
          paragraphs: [
            withPlatform(
              "All platform branding, course content, media, and materials remain the property of {platform} or its licensors. Access does not transfer ownership of any content.",
              platformName,
            ),
          ],
        },
        {
          heading: "7. Changes and availability",
          paragraphs: [
            "We may update these terms, improve features, or modify course availability when needed. Continued use of the platform after updates means you accept the revised terms.",
          ],
        },
        {
          heading: "8. Contact",
          paragraphs: [
            "For questions about these Terms and Conditions, please use the Contact page.",
          ],
        },
      ],
    };
  }

  return {
    title: "الشروط والأحكام",
    intro: withPlatform(
      "باستخدامك لمنصة {platform} فإنك توافق على هذه الشروط والأحكام. يرجى قراءتها بعناية قبل إنشاء حساب أو شراء أي دورة أو منتج.",
      platformName,
    ),
    updatedLabel: "آخر تحديث: سبتمبر 2026",
    sections: [
      {
        heading: "1. قبول الشروط",
        paragraphs: [
          withPlatform(
            "تحكم هذه الشروط استخدامك لموقع {platform} والدورات ومنتجات المتجر والاشتراكات والخدمات المرتبطة. إذا لم توافق، ينبغي عدم استخدام المنصة.",
            platformName,
          ),
        ],
      },
      {
        heading: "2. الحسابات",
        paragraphs: [
          "أنت مسؤول عن الحفاظ على أمان بيانات الدخول وعن جميع الأنشطة التي تتم عبر حسابك. يجب تقديم معلومات تسجيل دقيقة وإبلاغنا عند الاشتباه في وصول غير مصرح به.",
          "قد نوقف أو نُنهي الحسابات التي تنتهك هذه الشروط أو تسيء استخدام المنصة أو تشارك الوصول بشكل غير مشروع أو تحاول تجاوز ضوابط الأمان.",
        ],
      },
      {
        heading: "3. الدورات والمحتوى الرقمي",
        paragraphs: [
          "يُقدَّم الوصول إلى الدورات ومدتها والاختبارات والشهادات والميزات ذات الصلة كما هو موضح في صفحة كل دورة أو في لوحة التحكم. ما لم يُذكر خلاف ذلك، فإن المحتوى المشترى مرخّص للاستخدام التعليمي الشخصي فقط ولا يجوز نسخه أو إعادة توزيعه أو تسجيله أو مشاركته علناً.",
        ],
        bullets: [
          "عدم مشاركة بيانات الدخول مع الآخرين",
          "عدم تنزيل مواد الدورات أو إعادة توزيعها أو بيعها ما لم يُسمح بذلك صراحة",
          "أهلية الشهادة تعتمد على إكمال شروط الدورة المطلوبة",
        ],
      },
      {
        heading: "4. المدفوعات والأسعار",
        paragraphs: [
          "تُعرض الأسعار بعملة المنصة وقد تتغير مع الوقت. تصبح عمليات الشراء وشحن الرصيد والاشتراكات متاحة بعد تأكيد الدفع وفق الوسائل المعروضة في المنصة.",
        ],
      },
      {
        heading: "5. الاستخدام المقبول",
        paragraphs: [
          "توافق على عدم إساءة استخدام المنصة أو الإضرار بالمستخدمين الآخرين أو محاولة الوصول غير المصرح به أو رفع محتوى ضار أو استخدام الخدمة لأغراض غير قانونية.",
        ],
      },
      {
        heading: "6. الملكية الفكرية",
        paragraphs: [
          withPlatform(
            "تظل هوية المنصة ومحتوى الدورات والوسائط والمواد ملكاً لـ {platform} أو مرخّصيها. الوصول إلى المحتوى لا ينقل ملكيته.",
            platformName,
          ),
        ],
      },
      {
        heading: "7. التعديلات والتوافر",
        paragraphs: [
          "قد نحدّث هذه الشروط أو نحسّن الميزات أو نعدّل توافر الدورات عند الحاجة. استمرارك في استخدام المنصة بعد التحديث يعني قبولك للشروط المعدّلة.",
        ],
      },
      {
        heading: "8. التواصل",
        paragraphs: [
          "للاستفسار عن هذه الشروط والأحكام، يرجى استخدام صفحة اتصل بنا.",
        ],
      },
    ],
  };
}

export function getRefundPolicyCopy(locale: Locale, platformName: string): PageCopy {
  if (locale === "en") {
    return {
      title: "Refund Policy",
      intro: withPlatform(
        "This Refund Policy explains when refunds may be available for purchases made on {platform}, including courses, digital products, and wallet top-ups.",
        platformName,
      ),
      updatedLabel: "Last updated: September 2026",
      sections: [
        {
          heading: "1. Digital nature of our products",
          paragraphs: [
            "Most purchases on the platform are digital (course access, store files, subscriptions, or account balance). Once access or delivery has started, refunds are limited because the product cannot be returned like a physical item.",
          ],
        },
        {
          heading: "2. When a refund may be considered",
          paragraphs: [
            "We may review a refund request in cases such as:",
          ],
          bullets: [
            "A duplicate payment for the same purchase",
            "Payment confirmed but access was not granted due to a technical issue on our side",
            "An incorrect charge clearly caused by a platform error",
          ],
        },
        {
          heading: "3. When refunds are generally not available",
          paragraphs: [
            "Refunds are generally not provided when:",
          ],
          bullets: [
            "You simply change your mind after purchasing a course or digital product",
            "You have already accessed a substantial part of the course content",
            "You completed quizzes, downloaded materials, or received a certificate for the purchase",
            "Access expired according to the course access duration you were shown at purchase",
          ],
        },
        {
          heading: "4. How to request a review",
          paragraphs: [
            "To request a refund review, contact us through the Contact page as soon as possible and include your account details, purchase information, payment proof, and a clear explanation of the issue.",
            "We will review eligible requests and respond with the outcome. Approved refunds may be processed as a reversal to the original method or as platform balance, depending on the payment channel and case details.",
          ],
        },
        {
          heading: "5. Contact",
          paragraphs: [
            withPlatform(
              "For refund-related help, please contact the {platform} support team via the Contact page.",
              platformName,
            ),
          ],
        },
      ],
    };
  }

  return {
    title: "سياسة الاسترجاع",
    intro: withPlatform(
      "توضح سياسة الاسترجاع هذه متى يمكن النظر في طلبات الاسترداد للمشتريات على منصة {platform}، بما في ذلك الدورات والمنتجات الرقمية وشحن الرصيد.",
      platformName,
    ),
    updatedLabel: "آخر تحديث: سبتمبر 2026",
    sections: [
      {
        heading: "1. طبيعة المنتجات الرقمية",
        paragraphs: [
          "معظم المشتريات على المنصة رقمية (الوصول إلى الدورات أو ملفات المتجر أو الاشتراكات أو رصيد الحساب). بعد بدء الوصول أو التسليم تكون خيارات الاسترداد محدودة لأن المنتج لا يمكن إرجاعه مثل المنتج المادي.",
        ],
      },
      {
        heading: "2. متى يمكن النظر في الاسترداد",
        paragraphs: [
          "قد نراجع طلب استرداد في حالات مثل:",
        ],
        bullets: [
          "دفع مكرر لنفس عملية الشراء",
          "تأكيد الدفع دون منح الوصول بسبب مشكلة تقنية من جانبنا",
          "رسوم غير صحيحة ناتجة بوضوح عن خطأ في المنصة",
        ],
      },
      {
        heading: "3. متى لا يتوفر الاسترداد عادةً",
        paragraphs: [
          "لا يتم الاسترداد عادةً عندما:",
        ],
        bullets: [
          "تغير رأيك بعد شراء دورة أو منتج رقمي",
          "تكون قد وصلت إلى جزء كبير من محتوى الدورة",
          "أكملت اختبارات أو حمّلت مواد أو حصلت على شهادة مرتبطة بالشراء",
          "انتهت مدة الوصول وفقاً لما ظهر لك عند الشراء",
        ],
      },
      {
        heading: "4. كيفية طلب المراجعة",
        paragraphs: [
          "لطلب مراجعة استرداد، تواصل معنا عبر صفحة اتصل بنا في أقرب وقت ممكن مع ذكر بيانات حسابك ومعلومات الشراء وإثبات الدفع وشرح واضح للمشكلة.",
          "سنراجع الطلبات المؤهلة ونرد بالنتيجة. قد تُعالَج الاستردادات المقبولة كإرجاع لطريقة الدفع الأصلية أو كرصيد داخل المنصة حسب قناة الدفع وتفاصيل الحالة.",
        ],
      },
      {
        heading: "5. التواصل",
        paragraphs: [
          withPlatform(
            "للمساعدة المتعلقة بالاسترجاع، يرجى التواصل مع فريق دعم {platform} عبر صفحة اتصل بنا.",
            platformName,
          ),
        ],
      },
    ],
  };
}

export function getContactCopy(locale: Locale, platformName: string) {
  if (locale === "en") {
    return {
      title: "Contact Us",
      intro: withPlatform(
        "We are here to help with account questions, course access, payments, and general support for {platform}.",
        platformName,
      ),
      updatedLabel: "We usually respond as soon as possible during support hours.",
      howToTitle: "How to reach us",
      howToBody:
        "Use one of the available support channels below. Please include your registered name and a short description of your request so we can help faster.",
      whatsappLabel: "WhatsApp",
      whatsappCta: "Open WhatsApp",
      emailLabel: "Email",
      otherTitle: "Other useful links",
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      refund: "Refund Policy",
      courses: "Browse courses",
      noChannel:
        "Support channels will appear here once they are configured. You can also use the in-platform messaging area after signing in.",
    };
  }

  return {
    title: "اتصل بنا",
    intro: withPlatform(
      "نحن هنا للمساعدة في أسئلة الحساب والوصول إلى الدورات والمدفوعات والدعم العام لمنصة {platform}.",
      platformName,
    ),
    updatedLabel: "نرد عادة في أقرب وقت ممكن خلال ساعات الدعم.",
    howToTitle: "طرق التواصل",
    howToBody:
      "استخدم إحدى قنوات الدعم المتاحة أدناه. يرجى ذكر الاسم المسجل ووصف مختصر لطلبك لنتمكن من المساعدة بشكل أسرع.",
    whatsappLabel: "واتساب",
    whatsappCta: "فتح واتساب",
    emailLabel: "البريد الإلكتروني",
    otherTitle: "روابط مفيدة",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    refund: "سياسة الاسترجاع",
    courses: "تصفح الدورات",
    noChannel:
      "ستظهر قنوات الدعم هنا عند إعدادها. يمكنك أيضاً استخدام المراسلة داخل المنصة بعد تسجيل الدخول.",
  };
}
