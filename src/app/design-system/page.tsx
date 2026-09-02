import type { Metadata } from "next"
import { DropletIcon, SearchXIcon, ShoppingBagIcon } from "lucide-react"

import { BrandLockup, MiskMark } from "@/components/shared/brand-lockup"
import {
  OrderStatusBadge,
  StatusBadge,
  StockBadge,
} from "@/components/shared/status-badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  CATEGORY_ACCENT,
  ORDER_STATUS_LABEL,
  PRODUCT_TYPE_ACCENT,
  TONES,
  TONE_SOFT_CLASS,
  type OrderStatus,
} from "@/constants/design-system"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format"

export const metadata: Metadata = {
  title: "نظام التصميم",
  description:
    "نظام تصميم مِسك: الألوان، ومقاييس الطباعة، والظلال، والمكوّنات المبنية عليها.",
}

/* -------------------------------------------------------------------------
 * Page scaffolding
 * ---------------------------------------------------------------------- */

/** A Latin token name inside Arabic copy — isolated so bidi leaves it alone. */
function Token({ children }: { children: string }) {
  return (
    <code
      lang="en"
      dir="ltr"
      className="font-mono text-[0.8em] text-muted-foreground"
    >
      {children}
    </code>
  )
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-14">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-display-sm sm:text-display-md">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-10 space-y-12">{children}</div>
    </section>
  )
}

function Block({
  title,
  note,
  children,
}: {
  title: string
  note?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      {note ? (
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{note}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Colour
 * ---------------------------------------------------------------------- */

function Swatch({
  className,
  name,
  token,
  onDark,
}: {
  className: string
  name: string
  token: string
  onDark?: boolean
}) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex h-20 items-end rounded-lg border border-border/70 p-2.5 shadow-2xs",
          className
        )}
      >
        <span
          className={cn(
            "text-eyebrow",
            onDark ? "text-white/75" : "text-black/50"
          )}
        >
          {name}
        </span>
      </div>
      <p className="mt-1.5 truncate">
        <Token>{token}</Token>
      </p>
    </div>
  )
}

function SwatchGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]

const TONE_LABEL: Record<(typeof TONES)[number], string> = {
  neutral: "محايد",
  gold: "ذهبي",
  success: "نجاح",
  warning: "تنبيه",
  info: "معلومة",
  danger: "خطر",
}

const DISPLAY_SAMPLES = [
  ["display-2xl", "text-display-2xl", "مِسك"],
  ["display-xl", "text-display-xl", "مزيجٌ بِاليَد"],
  ["display-lg", "text-display-lg", "خط الدهن الخالص"],
  ["display-md", "text-display-md", "المكوّنات والصناعة"],
  ["display-sm", "text-display-sm", "عنبر الورد"],
  ["display-xs", "text-display-xs", "العبوة الفاخرة"],
] as const

const RADII = [
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["lg", "rounded-lg"],
  ["xl", "rounded-xl"],
  ["2xl", "rounded-2xl"],
  ["3xl", "rounded-3xl"],
] as const

const SHADOWS = [
  ["xs", "shadow-xs"],
  ["sm", "shadow-sm"],
  ["md", "shadow-md"],
  ["lg", "shadow-lg"],
  ["xl", "shadow-xl"],
  ["flacon", "shadow-flacon"],
] as const

const PRODUCTS = [
  {
    name: "عنبر الورد",
    category: "women",
    type: "ALCOHOL",
    from: 690,
    stock: 24,
  },
  {
    name: "دهن عود ملكي",
    category: "men",
    type: "RAW_OIL",
    from: 1450,
    stock: 3,
  },
  {
    name: "برغموت أزرق",
    category: "youth",
    type: "ALCOHOL",
    from: 540,
    stock: 0,
  },
] as const

export default function DesignSystemPage() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-6">
          <BrandLockup size="sm" tagline="نظام التصميم" href={false} />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-page px-6 pb-24">
        {/* Hero ------------------------------------------------------- */}
        <div className="brand-sheen -mx-6 px-6 py-20">
          <p className="eyebrow">مِسك · دار عطور</p>
          <h1 className="mt-5 max-w-3xl text-display-md sm:text-display-lg lg:text-display-xl">
            نمزجه بأيدينا،
            <br />
            ونصمّمه بالطريقة نفسها.
          </h1>
          <p className="mt-6 max-w-prose text-base text-muted-foreground">
            يبيع مِسك العطر الواحد بأشكال عدّة — <span data-numeric>30</span> أو{" "}
            <span data-numeric>50</span> أو <span data-numeric>100</span>{" "}
            مليلتر، في عبوة فاخرة أو عادية، أو دهنًا خالصًا يُباع بالجرام. نظام
            التصميم موجود كي لا يبدو هذا التشعّب فوضى.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="gold" size="xl">
              <ShoppingBagIcon data-icon="inline-start" />
              تسوّق المجموعة
            </Button>
            <Button variant="outline" size="xl">
              حكاية الصناعة
            </Button>
          </div>
        </div>

        {/* Colour ----------------------------------------------------- */}
        <Section
          id="colour"
          eyebrow="الأسس"
          title="الألوان"
          description={
            <>
              كل لون معرّف بـ <Token>oklch</Token> حتى تبقى الإضاءة متساوية
              الإحساس بين النمطين. العاج والمسك يحملان الصفحة، والذهبي هو اللون
              المشبع الوحيد — ويُصرف بحساب: عنصر ذهبي واحد في كل شاشة.
            </>
          }
        >
          <Block
            title="ألوان العلامة"
            note="الذهبي يعلّم الشيء الوحيد الذي نريد أن تلمسه. والعود هو الثقل المقابل — التذييل، وخط الدهن، وشارة تمييز واحدة."
          >
            <SwatchGrid>
              <Swatch className="bg-gold" name="ذهبي" token="--gold" />
              <Swatch
                className="bg-gold-soft"
                name="ذهبي فاتح"
                token="--gold-soft"
              />
              <Swatch className="bg-oud" name="عود" token="--oud" onDark />
              <Swatch className="bg-musk" name="مسك" token="--musk" onDark />
              <Swatch
                className="bg-vetiver"
                name="نجيل"
                token="--vetiver"
                onDark
              />
            </SwatchGrid>
          </Block>

          <Block
            title="الأسطح والنص"
            note="عقد shadcn. المكوّنات تقرأ هذه الرموز ولا تقرأ سواها."
          >
            <SwatchGrid>
              <Swatch
                className="bg-background"
                name="الخلفية"
                token="--background"
              />
              <Swatch className="bg-card" name="البطاقة" token="--card" />
              <Swatch className="bg-muted" name="خافت" token="--muted" />
              <Swatch
                className="bg-secondary"
                name="ثانوي"
                token="--secondary"
              />
              <Swatch
                className="bg-primary"
                name="أساسي"
                token="--primary"
                onDark
              />
            </SwatchGrid>
          </Block>

          <Block
            title="الحالات"
            note="لكل نبرة زوجان: صريح وهادئ. الشارات تستخدم الهادئ، والصريح لعنصر تحكّم حاسم واحد."
          >
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <span
                  key={tone}
                  className={cn(
                    "rounded-4xl px-3 py-1 text-xs font-medium",
                    TONE_SOFT_CLASS[tone]
                  )}
                >
                  {TONE_LABEL[tone]}
                </span>
              ))}
            </div>
          </Block>

          <Block
            title="ألوان الكتالوج"
            note="لون لكل فئة، مأخوذ من العائلة العطرية التي تعرّف الخط، ولون لكل نوع منتج. يُستخدم خطًّا رفيعًا أو نقطة — لا خلفية ممتلئة تنازع أرضية العاج."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                Object.keys(CATEGORY_ACCENT) as (keyof typeof CATEGORY_ACCENT)[]
              ).map((slug) => {
                const accent = CATEGORY_ACCENT[slug]
                return (
                  <div
                    key={slug}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <span
                      className={cn("block h-0.5 w-10 rounded-full", accent.bg)}
                    />
                    <p className="mt-3 font-display text-display-xs font-bold">
                      {accent.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {accent.note}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                Object.keys(
                  PRODUCT_TYPE_ACCENT
                ) as (keyof typeof PRODUCT_TYPE_ACCENT)[]
              ).map((type) => {
                const accent = PRODUCT_TYPE_ACCENT[type]
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <span
                      className={cn("size-2.5 rounded-full", accent.bg)}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium">{accent.label}</p>
                      <p className="text-xs text-muted-foreground">
                        يُباع بِ{accent.unit === "ml" ? "الحجم" : "الوزن"} ·{" "}
                        <Token>{type}</Token>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Block>
        </Section>

        {/* Typography ------------------------------------------------- */}
        <Section
          id="typography"
          eyebrow="الأسس"
          title="الطباعة"
          description={
            <>
              خط <span dir="ltr">Amiri</span> يحمل الصوت، و
              <span dir="ltr">IBM Plex Sans Arabic</span> يحمل العمل. لا تباعد
              بين الحروف في أي مقاس — النسخ خط متصل، والتباعد يفكّ وصلاته. وأسطر
              أوسع مما يحتاجه نظام لاتيني، لتمرّ التشكيلات فوق السطر والنزلات
              تحته.
            </>
          }
        >
          <Block title="مقاس العناوين — Amiri">
            <div className="space-y-6">
              {DISPLAY_SAMPLES.map(([name, cls, sample]) => (
                <div
                  key={name}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-border/60 pb-5"
                >
                  <span className="w-28 shrink-0">
                    <Token>{name}</Token>
                  </span>
                  <span className={cn("font-display", cls)}>{sample}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block
            title="مقاس الواجهة — IBM Plex Sans Arabic"
            note="النصوص والتسميات وكل عناصر التحكّم. لا شيء أكبر من text-xl."
          >
            <div className="space-y-3">
              <p className="text-xl">مقدّمة قسم أو ملخّص منتج — text-xl</p>
              <p className="text-base">
                نص الفقرة والوصف وملاحظات المكوّنات — text-base
              </p>
              <p className="text-sm text-muted-foreground">
                نص ثانوي ونص مساعد وخلايا الجداول — text-sm
              </p>
              <p className="text-xs text-muted-foreground">
                بيانات وصفية وتواريخ وهوامش — text-xs
              </p>
              <p className="eyebrow">
                عنوان تمهيدي أو تسمية مجموعة خيارات — eyebrow
              </p>
              <p className="font-mono text-sm" data-ltr>
                MSK-2481-0093 · 100ml
              </p>
            </div>
          </Block>

          <Block
            title="الأرقام"
            note="الأرقام لاتينية بقرار من الدار — هي ما يُنسخ إلى تطبيق البنك واستمارة الشحن. وكل رقم يُعزل باتجاه من اليسار إلى اليمين، وإلا انقلب ترتيبه داخل الجملة العربية."
          >
            <div className="flex flex-wrap items-baseline gap-6">
              <p className="text-display-sm font-display" data-numeric>
                {formatPrice(1450)}
              </p>
              <p className="text-display-sm font-display" data-numeric>
                {formatPrice(690)}
              </p>
              <p className="text-sm text-muted-foreground">
                سعر واحد داخل جملة: يبدأ السعر من{" "}
                <span className="font-medium text-foreground" data-numeric>
                  {formatPrice(540)}
                </span>{" "}
                للعبوة العادية.
              </p>
            </div>
          </Block>
        </Section>

        {/* Form & elevation ------------------------------------------- */}
        <Section
          id="form"
          eyebrow="الأسس"
          title="الشكل والظل والحركة"
          description="انحناء 6 بكسل: حادّ بما يكفي ليُقرأ مدروسًا، ولَيّن بما يكفي ألّا يبدو طبّيًّا. والظلال مائلة إلى الدفء — الأسود المحايد يبهت رماديًّا فوق العاج."
        >
          <Block title="الانحناء">
            <div className="flex flex-wrap items-end gap-4">
              {RADII.map(([name, cls]) => (
                <div key={name} className="text-center">
                  <div
                    className={cn(
                      "size-16 border border-border bg-secondary",
                      cls
                    )}
                  />
                  <p className="mt-2">
                    <Token>{name}</Token>
                  </p>
                </div>
              ))}
            </div>
          </Block>

          <Block
            title="الارتفاع"
            note={
              <>
                <Token>shadow-flacon</Token> هو ظل تصوير المنتج: منخفض وعريض
                وناعم، كقارورة واقفة على رفّ.
              </>
            }
          >
            <div className="flex flex-wrap items-end gap-6">
              {SHADOWS.map(([name, cls]) => (
                <div key={name} className="text-center">
                  <div
                    className={cn(
                      "size-20 rounded-lg border border-border bg-card",
                      cls
                    )}
                  />
                  <p className="mt-3">
                    <Token>{name}</Token>
                  </p>
                </div>
              ))}
            </div>
          </Block>

          <Block
            title="الحركة"
            note={
              <>
                <Token>ease-luxe</Token> لكل ما يدخل الشاشة — الأدراج والحوارات
                وانتقالات المعرض. مرّر المؤشر فوق الشريط.
              </>
            }
          >
            <div className="group inline-flex flex-col items-start gap-3">
              <div className="h-14 w-64 overflow-hidden rounded-lg border border-border bg-secondary">
                <div className="h-full w-1/4 bg-gold transition-[width] duration-700 ease-luxe group-hover:w-full" />
              </div>
              <Token>duration-700 ease-luxe</Token>
            </div>
          </Block>

          <Block title="العلامة">
            <div className="flex flex-wrap items-end gap-10 rounded-lg border border-border bg-card p-8">
              <MiskMark className="size-16" />
              <BrandLockup size="lg" href={false} />
              <BrandLockup size="sm" tagline="دار عطور" href={false} />
              <BrandLockup size="sm" script="en" href={false} />
            </div>
          </Block>
        </Section>

        {/* Components ------------------------------------------------- */}
        <Section
          id="components"
          eyebrow="المكوّنات"
          title="عناصر التحكّم"
          description={
            <>
              مكتبة <span dir="ltr">shadcn/ui</span> فوق{" "}
              <span dir="ltr">Base UI</span>، مُعاد تلوينها بالرموز أعلاه ومولّدة
              بوضع RTL فتستخدم الخصائص المنطقية (<Token>ps</Token> و
              <Token>pe</Token>) بدل اليمين واليسار. إضافتان تحملان العلامة: نوع
              زر ذهبي، ومجموعة نبرات دلالية للشارات.
            </>
          }
        >
          <Block
            title="الأزرار"
            note="الذهبي هو زر العلامة، وهو ثابت بين النمطين — يبدو واحدًا في الفاتح والداكن، بخلاف الأساسي الذي ينقلب."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="gold">أضف إلى السلة</Button>
              <Button>إتمام الطلب</Button>
              <Button variant="secondary">احفظ لاحقًا</Button>
              <Button variant="outline">تابع التسوّق</Button>
              <Button variant="ghost">إلغاء</Button>
              <Button variant="destructive">حذف</Button>
              <Button variant="link">دليل المقاسات</Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="gold" size="xl">
                أضف إلى السلة — xl
              </Button>
              <Button variant="gold" size="lg">
                lg
              </Button>
              <Button variant="gold">default</Button>
              <Button variant="gold" size="sm">
                sm
              </Button>
              <Button variant="gold" size="xs">
                xs
              </Button>
            </div>
          </Block>

          <Block
            title="الشارات"
            note={
              <>
                اقرأ النبرة من <Token>@/constants/design-system</Token> — لا
                تختَرها بالعين عند الاستخدام.
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold">الأكثر مبيعًا</Badge>
              <Badge variant="success">متوفر</Badge>
              <Badge variant="warning">كمية محدودة</Badge>
              <Badge variant="info">مزيج جديد</Badge>
              <Badge variant="neutral">يُحضَّر عند الطلب</Badge>
              <Badge variant="solid">دفعة محدودة</Badge>
              <Badge variant="outline">
                <span data-ltr>100ml</span>
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ORDER_STATUSES.map((status) => (
                <OrderStatusBadge key={status} status={status} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StockBadge stock={42} />
              <StockBadge stock={3} />
              <StockBadge stock={0} />
            </div>
          </Block>

          <Block title="الحقول">
            <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ds-name">اسم العطر</FieldLabel>
                <Input id="ds-name" defaultValue="عنبر الورد" />
                <FieldDescription>
                  يظهر في صفحة المنتج وفي إيصال الطلب.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-category">الفئة</FieldLabel>
                <Select defaultValue="women">
                  <SelectTrigger id="ds-category" className="w-full">
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youth">شبابي</SelectItem>
                    <SelectItem value="women">نسائي</SelectItem>
                    <SelectItem value="men">رجالي</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  تقود قائمة المتجر ولون الفئة.
                </FieldDescription>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="ds-ingredients">المكوّنات</FieldLabel>
                <Textarea
                  id="ds-ingredients"
                  rows={3}
                  defaultValue="مطلق الورد الدمشقي، أكورد العنبر، مسك أبيض، كحول طبي نقي."
                />
              </Field>
            </div>
          </Block>

          <Block title="الحالة الفارغة">
            <Empty className="max-w-xl rounded-lg border border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>لا عطر يطابق هذه الفلاتر</EmptyTitle>
                <EmptyDescription>
                  جرّب توسيع نطاق الأحجام، أو امسح فلتر نوع العبوة.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Block>
        </Section>

        {/* Patterns --------------------------------------------------- */}
        <Section
          id="patterns"
          eyebrow="الأنماط"
          title="الكتالوج"
          description="هنا يلتقي النظام بنموذج المنتج: شكلان للخيارات، وتخطيط واحد. الخط الكحولي يختار الحجم ثم العبوة، وخط الدهن يختار الوزن فقط."
        >
          <Block title="بطاقة المنتج">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((product) => (
                <Card key={product.name} className="overflow-hidden pt-0">
                  <div className="flacon-plate flex h-44 items-center justify-center">
                    <DropletIcon
                      className={cn(
                        "size-12",
                        PRODUCT_TYPE_ACCENT[product.type].text
                      )}
                    />
                  </div>
                  <CardHeader>
                    <p className="eyebrow">
                      {CATEGORY_ACCENT[product.category].label} ·{" "}
                      {PRODUCT_TYPE_ACCENT[product.type].label}
                    </p>
                    <CardTitle className="mt-1.5 font-display text-display-xs font-bold">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {CATEGORY_ACCENT[product.category].note}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      يبدأ من{" "}
                      <span
                        className="text-base font-medium text-foreground"
                        data-numeric
                      >
                        {formatPrice(product.from)}
                      </span>
                    </p>
                    <StockBadge stock={product.stock} />
                  </CardContent>
                  <CardFooter>
                    <Button variant="gold" className="w-full">
                      اختر الخيارات
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </Block>

          <Block
            title="مُحدِّد الخيارات"
            note="المكوّن الوحيد الذي يتفرّع بحسب نوع المنتج. الفرعان يستخدمان مجموعة الأزرار نفسها، والتسمية التمهيدية نفسها، وكتلة السعر نفسها — فلا يبدو الخطّان متجرين."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <Badge variant="info">عطر كحولي</Badge>
                <h4 className="mt-3 text-display-sm font-bold">عنبر الورد</h4>

                <p className="eyebrow mt-6">الحجم</p>
                <ToggleGroup
                  className="mt-2"
                  variant="outline"
                  defaultValue={["50"]}
                >
                  <ToggleGroupItem value="30">
                    <span data-ltr>30ml</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="50">
                    <span data-ltr>50ml</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="100">
                    <span data-ltr>100ml</span>
                  </ToggleGroupItem>
                </ToggleGroup>

                <p className="eyebrow mt-6">العبوة</p>
                <ToggleGroup
                  className="mt-2"
                  variant="outline"
                  defaultValue={["luxury"]}
                >
                  <ToggleGroupItem value="regular">عادية</ToggleGroupItem>
                  <ToggleGroupItem value="luxury">فاخرة</ToggleGroupItem>
                </ToggleGroup>

                <Separator className="my-6" />
                <div className="flex items-end justify-between">
                  <p className="font-display text-display-sm" data-numeric>
                    {formatPrice(890)}
                  </p>
                  <StatusBadge tone="success">متوفر</StatusBadge>
                </div>
                <Button variant="gold" size="xl" className="mt-5 w-full">
                  <ShoppingBagIcon data-icon="inline-start" />
                  أضف إلى السلة
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <Badge variant="gold">دهن عطري مركّز</Badge>
                <h4 className="mt-3 text-display-sm font-bold">دهن عود ملكي</h4>

                <p className="eyebrow mt-6">الوزن</p>
                <ToggleGroup
                  className="mt-2"
                  variant="outline"
                  defaultValue={["8"]}
                >
                  <ToggleGroupItem value="5">
                    <span data-ltr>5g</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="8">
                    <span data-ltr>8g</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="12">
                    <span data-ltr>12g</span>
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="mt-3 text-sm text-muted-foreground">
                  دهن خالص غير مخفّف — بلا كحول، وبلا اختيار عبوة.
                </p>

                <Separator className="my-6" />
                <div className="flex items-end justify-between">
                  <p className="font-display text-display-sm" data-numeric>
                    {formatPrice(1450)}
                  </p>
                  <StatusBadge tone="warning">كمية محدودة</StatusBadge>
                </div>
                <Button variant="gold" size="xl" className="mt-5 w-full">
                  <ShoppingBagIcon data-icon="inline-start" />
                  أضف إلى السلة
                </Button>
              </div>
            </div>
          </Block>

          <Block title="فاصل القسم">
            <div className="mx-auto max-w-prose text-center">
              <hr className="rule-gold" />
              <p className="eyebrow mt-6">الجودة والمكوّنات</p>
              <h4 className="mt-3 text-display-sm sm:text-display-md">
                كحول طبي نقي، وزيوت فاخرة، ولا شيء غير ذلك.
              </h4>
            </div>
          </Block>
        </Section>
      </main>
    </div>
  )
}
