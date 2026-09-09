-- Milestone 21.5 Phase 4C.2 — Creator Profile Skill Taxonomy V1
--
-- Founder-directed initial taxonomy: intentionally compact, bilingual, and
-- controlled. Skills remain normalized entities rather than free-text profile
-- tags so Creator readiness and future discovery can share one vocabulary.
--
-- This migration is idempotent because create-schema.mjs reapplies numbered SQL
-- files. On conflict we refresh canonical copy/category/order, but deliberately
-- preserve the existing active flag so a later operational deactivation is not
-- silently undone by rerunning db:schema.

-- taxonomy:categories:start
INSERT INTO profile_skill_categories (
  slug,
  title_en,
  title_fa,
  sort_order
)
VALUES
  ('ai-prompting', 'AI & Prompting', 'هوش مصنوعی و پرامپت‌نویسی', 10),
  ('product-design', 'Product & Design', 'محصول و طراحی', 20),
  ('software-development', 'Software Development', 'توسعه نرم‌افزار', 30),
  ('visual-creation', 'Visual Creation', 'خلق بصری', 40),
  ('content-language', 'Content & Language', 'محتوا و زبان', 50),
  ('data-automation', 'Data & Automation', 'داده و اتوماسیون', 60),
  ('media-production', 'Media Production', 'تولید رسانه', 70),
  ('business-growth', 'Business & Growth', 'کسب‌وکار و رشد', 80)
ON CONFLICT (slug) DO UPDATE
SET
  title_en = EXCLUDED.title_en,
  title_fa = EXCLUDED.title_fa,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
-- taxonomy:categories:end

-- taxonomy:skills:start
INSERT INTO profile_skills (
  slug,
  category_slug,
  title_en,
  title_fa,
  sort_order
)
VALUES
  ('prompt-engineering', 'ai-prompting', 'Prompt Engineering', 'مهندسی پرامپت', 10),
  ('prompt-design', 'ai-prompting', 'Prompt Design', 'طراحی پرامپت', 20),
  ('generative-ai', 'ai-prompting', 'Generative AI', 'هوش مصنوعی مولد', 30),
  ('llm-workflows', 'ai-prompting', 'LLM Workflows', 'جریان‌های کاری مدل‌های زبانی', 40),
  ('ai-agents', 'ai-prompting', 'AI Agents', 'عامل‌های هوش مصنوعی', 50),

  ('product-design', 'product-design', 'Product Design', 'طراحی محصول', 10),
  ('ux-design', 'product-design', 'UX Design', 'طراحی تجربه کاربری', 20),
  ('ui-design', 'product-design', 'UI Design', 'طراحی رابط کاربری', 30),
  ('design-systems', 'product-design', 'Design Systems', 'سیستم‌های طراحی', 40),
  ('prototyping', 'product-design', 'Prototyping', 'نمونه‌سازی', 50),

  ('web-development', 'software-development', 'Web Development', 'توسعه وب', 10),
  ('frontend-development', 'software-development', 'Frontend Development', 'توسعه فرانت‌اند', 20),
  ('backend-development', 'software-development', 'Backend Development', 'توسعه بک‌اند', 30),
  ('full-stack-development', 'software-development', 'Full-stack Development', 'توسعه فول‌استک', 40),
  ('api-design', 'software-development', 'API Design', 'طراحی API', 50),

  ('graphic-design', 'visual-creation', 'Graphic Design', 'طراحی گرافیک', 10),
  ('illustration', 'visual-creation', 'Illustration', 'تصویرسازی', 20),
  ('photography', 'visual-creation', 'Photography', 'عکاسی', 30),
  ('ai-image-generation', 'visual-creation', 'AI Image Generation', 'تولید تصویر با هوش مصنوعی', 40),
  ('art-direction', 'visual-creation', 'Art Direction', 'کارگردانی هنری', 50),

  ('copywriting', 'content-language', 'Copywriting', 'کپی‌رایتینگ', 10),
  ('technical-writing', 'content-language', 'Technical Writing', 'نویسندگی فنی', 20),
  ('content-strategy', 'content-language', 'Content Strategy', 'استراتژی محتوا', 30),
  ('storytelling', 'content-language', 'Storytelling', 'داستان‌گویی', 40),
  ('localization', 'content-language', 'Localization', 'بومی‌سازی', 50),

  ('data-analysis', 'data-automation', 'Data Analysis', 'تحلیل داده', 10),
  ('automation', 'data-automation', 'Automation', 'اتوماسیون', 20),
  ('workflow-design', 'data-automation', 'Workflow Design', 'طراحی جریان کاری', 30),
  ('no-code-low-code', 'data-automation', 'No-Code / Low-Code', 'نوکد / لوکد', 40),
  ('data-visualization', 'data-automation', 'Data Visualization', 'مصورسازی داده', 50),

  ('video-production', 'media-production', 'Video Production', 'تولید ویدئو', 10),
  ('video-editing', 'media-production', 'Video Editing', 'تدوین ویدئو', 20),
  ('motion-design', 'media-production', 'Motion Design', 'موشن دیزاین', 30),
  ('audio-production', 'media-production', 'Audio Production', 'تولید صدا', 40),
  ('3d-design', 'media-production', '3D Design', 'طراحی سه‌بعدی', 50),

  ('product-management', 'business-growth', 'Product Management', 'مدیریت محصول', 10),
  ('growth-marketing', 'business-growth', 'Growth Marketing', 'بازاریابی رشد', 20),
  ('seo', 'business-growth', 'SEO', 'سئو', 30),
  ('branding', 'business-growth', 'Branding', 'برندینگ', 40),
  ('entrepreneurship', 'business-growth', 'Entrepreneurship', 'کارآفرینی', 50)
ON CONFLICT (slug) DO UPDATE
SET
  category_slug = EXCLUDED.category_slug,
  title_en = EXCLUDED.title_en,
  title_fa = EXCLUDED.title_fa,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
-- taxonomy:skills:end
