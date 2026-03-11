import base64
from io import BytesIO
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from models.portfolio import Portfolio
from models.user_profile import UserProfile
from models.resume import TailoredResume
from models.career_description import CareerDescription


class DocumentGenerator:
    """Simple, clean resume document generator."""

    GRAY = RGBColor(0x66, 0x66, 0x66)
    BLACK = RGBColor(0x22, 0x22, 0x22)

    def _add_line(self, doc):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        pPr = p._p.get_or_add_pPr()
        pBdr = pPr.makeelement(qn('w:pBdr'), {})
        bottom = pBdr.makeelement(qn('w:bottom'), {
            qn('w:val'): 'single',
            qn('w:sz'): '6',
            qn('w:space'): '1',
            qn('w:color'): '333333',
        })
        pBdr.append(bottom)
        pPr.append(pBdr)

    def _heading(self, doc, text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = self.BLACK
        self._add_line(doc)

    def _sub_item(self, doc, bold_text: str, light_text: str = ""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        run = p.add_run(bold_text)
        run.bold = True
        run.font.size = Pt(10)
        if light_text:
            run = p.add_run(f"  {light_text}")
            run.font.size = Pt(9)
            run.font.color.rgb = self.GRAY

    def _bullet(self, doc, text: str):
        p = doc.add_paragraph(text, style="List Bullet")
        p.paragraph_format.space_after = Pt(1)
        for run in p.runs:
            run.font.size = Pt(9)

    def _decode_photo(self, photo_url: str) -> BytesIO | None:
        """Decode a base64 data URL photo into a BytesIO buffer."""
        if not photo_url or not photo_url.startswith("data:"):
            return None
        try:
            _, b64_data = photo_url.split(",", 1)
            image_bytes = base64.b64decode(b64_data)
            buf = BytesIO(image_bytes)
            return buf
        except Exception:
            return None

    def _add_photo_header(self, doc, profile: UserProfile, title_text: str, subtitle_text: str = ""):
        """Add a header with photo on the left and name/contact on the right."""
        photo_buf = self._decode_photo(profile.photo_url) if hasattr(profile, 'photo_url') else None

        if photo_buf:
            table = doc.add_table(rows=1, cols=2)
            table.alignment = WD_TABLE_ALIGNMENT.LEFT
            table.autofit = False

            # Remove table borders
            tbl = table._tbl
            tblPr = tbl.tblPr if tbl.tblPr is not None else tbl._add_tblPr()
            borders = tblPr.makeelement(qn('w:tblBorders'), {})
            for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
                border_elem = borders.makeelement(qn(f'w:{border_name}'), {
                    qn('w:val'): 'none', qn('w:sz'): '0', qn('w:space'): '0', qn('w:color'): 'auto'
                })
                borders.append(border_elem)
            tblPr.append(borders)

            # Photo cell
            photo_cell = table.cell(0, 0)
            photo_cell.width = Cm(3)
            photo_para = photo_cell.paragraphs[0]
            photo_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = photo_para.add_run()
            run.add_picture(photo_buf, width=Cm(2.5))

            # Name/info cell
            info_cell = table.cell(0, 1)
            p = info_cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(4)
            run = p.add_run(title_text)
            run.bold = True
            run.font.size = Pt(20)
            run.font.color.rgb = self.BLACK

            # Contact info
            contact = []
            if profile.email:
                contact.append(profile.email)
            if profile.phone:
                contact.append(profile.phone)
            if profile.github:
                contact.append(profile.github)
            if profile.blog:
                contact.append(profile.blog)
            if contact:
                p2 = info_cell.add_paragraph(" · ".join(contact))
                p2.paragraph_format.space_after = Pt(2)
                for r in p2.runs:
                    r.font.size = Pt(9)
                    r.font.color.rgb = self.GRAY

            if subtitle_text:
                p3 = info_cell.add_paragraph(subtitle_text)
                p3.paragraph_format.space_after = Pt(2)
                for r in p3.runs:
                    r.font.size = Pt(10)
                    r.font.color.rgb = self.GRAY

            return True
        return False

    def generate_docx(
        self,
        profile: UserProfile,
        tailored_resume: TailoredResume,
        portfolios: list[Portfolio],
    ) -> BytesIO:
        doc = Document()

        style = doc.styles["Normal"]
        style.font.name = "Calibri"
        style.font.size = Pt(10)
        style.paragraph_format.space_after = Pt(2)
        style.paragraph_format.line_spacing = 1.2

        for section in doc.sections:
            section.top_margin = Cm(2)
            section.bottom_margin = Cm(2)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)

        # === Name + Photo ===
        has_photo = self._add_photo_header(doc, profile, profile.name)

        if not has_photo:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(profile.name)
            run.bold = True
            run.font.size = Pt(20)
            run.font.color.rgb = self.BLACK

            # === Contact ===
            contact = []
            if profile.email:
                contact.append(profile.email)
            if profile.phone:
                contact.append(profile.phone)
            if profile.github:
                contact.append(profile.github)
            if profile.blog:
                contact.append(profile.blog)
            if contact:
                p = doc.add_paragraph(" · ".join(contact))
                p.paragraph_format.space_after = Pt(6)
                for run in p.runs:
                    run.font.size = Pt(9)
                    run.font.color.rgb = self.GRAY

        # === Summary ===
        if tailored_resume.summary:
            self._heading(doc, "SUMMARY")
            p = doc.add_paragraph(tailored_resume.summary)
            p.paragraph_format.space_after = Pt(4)
            for run in p.runs:
                run.font.size = Pt(10)

        # === Work Experience ===
        if profile.work_experience:
            has_valid = any(w.company for w in profile.work_experience)
            if has_valid:
                self._heading(doc, "EXPERIENCE")
                for work in profile.work_experience:
                    if not work.company:
                        continue
                    period = f"{work.start_date} ~ {'재직중' if work.is_current else work.end_date}"
                    self._sub_item(doc, f"{work.company} · {work.position}", period)
                    if work.team:
                        p = doc.add_paragraph(work.team)
                        for run in p.runs:
                            run.font.size = Pt(9)
                            run.font.color.rgb = self.GRAY
                    if work.description:
                        self._bullet(doc, work.description)
                    for proj in work.projects:
                        if proj.name:
                            self._bullet(doc, f"{proj.name}: {proj.description}")

        # === Projects ===
        portfolio_map = {p.id: p for p in portfolios}
        valid_entries = [e for e in tailored_resume.entries if portfolio_map.get(e.portfolio_id)]
        if valid_entries:
            self._heading(doc, "PROJECTS")
            for entry in valid_entries:
                portfolio = portfolio_map[entry.portfolio_id]
                self._sub_item(
                    doc,
                    portfolio.title,
                    f"{portfolio.role} · {portfolio.period}",
                )
                p = doc.add_paragraph(entry.tailored_description)
                p.paragraph_format.space_after = Pt(1)
                for run in p.runs:
                    run.font.size = Pt(9)
                for ach in entry.tailored_achievements:
                    self._bullet(doc, ach)
                if portfolio.tech_stack:
                    p = doc.add_paragraph(", ".join(portfolio.tech_stack))
                    p.paragraph_format.space_after = Pt(6)
                    for run in p.runs:
                        run.font.size = Pt(8)
                        run.font.color.rgb = self.GRAY

        # === Education ===
        if profile.education:
            self._heading(doc, "EDUCATION")
            for edu in profile.education:
                parts = []
                if edu.major:
                    parts.append(edu.major)
                if edu.degree:
                    parts.append(edu.degree)
                period = ""
                if edu.start_date or edu.end_date:
                    period = f"{edu.start_date} ~ {edu.end_date}"
                gpa_text = f"  GPA {edu.gpa}/{edu.gpa_scale}" if edu.gpa else ""
                self._sub_item(
                    doc,
                    edu.school,
                    f"{' · '.join(parts)}  {period}{gpa_text}",
                )

        # === Certificates ===
        if profile.certificates:
            has_valid = any(c.name for c in profile.certificates)
            if has_valid:
                self._heading(doc, "CERTIFICATES")
                for cert in profile.certificates:
                    if not cert.name:
                        continue
                    self._sub_item(doc, cert.name, f"{cert.issuer}  {cert.date}")

        # === Awards ===
        if profile.awards:
            has_valid = any(a.name for a in profile.awards)
            if has_valid:
                self._heading(doc, "AWARDS")
                for award in profile.awards:
                    if not award.name:
                        continue
                    self._sub_item(doc, award.name, f"{award.issuer}  {award.date}")
                    if award.description:
                        p = doc.add_paragraph(award.description)
                        for run in p.runs:
                            run.font.size = Pt(9)

        # === Skills ===
        all_skills: set[str] = set()
        for portfolio in portfolios:
            all_skills.update(portfolio.tech_stack)
        if all_skills:
            self._heading(doc, "SKILLS")
            p = doc.add_paragraph(", ".join(sorted(all_skills)))
            for run in p.runs:
                run.font.size = Pt(9)

        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

    def generate_cover_letter_docx(
        self, answers: list[dict], profile: UserProfile | None = None
    ) -> BytesIO:
        doc = Document()
        style = doc.styles["Normal"]
        style.font.name = "Calibri"
        style.font.size = Pt(11)

        if profile and profile.name:
            title = doc.add_paragraph()
            title.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = title.add_run(f"{profile.name} - 자기소개서")
            run.bold = True
            run.font.size = Pt(16)
            doc.add_paragraph()

        for i, qa in enumerate(answers, 1):
            q_para = doc.add_paragraph()
            run = q_para.add_run(f"Q{i}. {qa['question']}")
            run.bold = True
            doc.add_paragraph(qa["answer"])
            doc.add_paragraph()

        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

    def generate_career_desc_docx(
        self,
        profile: UserProfile,
        career_desc: CareerDescription,
        portfolios: list[Portfolio],
    ) -> BytesIO:
        doc = Document()

        style = doc.styles["Normal"]
        style.font.name = "Calibri"
        style.font.size = Pt(10)
        style.paragraph_format.space_after = Pt(2)
        style.paragraph_format.line_spacing = 1.2

        for section in doc.sections:
            section.top_margin = Cm(2)
            section.bottom_margin = Cm(2)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)

        # Title + Photo
        has_photo = self._add_photo_header(
            doc, profile,
            f"{profile.name} - 경력기술서",
            f"지원 직무: {career_desc.target_role}"
        )

        if not has_photo:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(f"{profile.name} - 경력기술서")
            run.bold = True
            run.font.size = Pt(18)
            run.font.color.rgb = self.BLACK

            # Target role
            p = doc.add_paragraph(f"지원 직무: {career_desc.target_role}")
            p.paragraph_format.space_after = Pt(6)
            for run in p.runs:
                run.font.size = Pt(10)
                run.font.color.rgb = self.GRAY

        # Summary
        if career_desc.summary:
            self._heading(doc, "경력 요약")
            p = doc.add_paragraph(career_desc.summary)
            p.paragraph_format.space_after = Pt(6)
            for run in p.runs:
                run.font.size = Pt(10)

        # Entries
        if career_desc.entries:
            self._heading(doc, "경력 상세")
            for entry in career_desc.entries:
                self._sub_item(doc, f"{entry.company} · {entry.position}", entry.period)

                if entry.description:
                    p = doc.add_paragraph(entry.description)
                    p.paragraph_format.space_after = Pt(2)
                    for run in p.runs:
                        run.font.size = Pt(9)

                if entry.key_achievements:
                    p = doc.add_paragraph()
                    run = p.add_run("핵심 성과")
                    run.bold = True
                    run.font.size = Pt(9)
                    for ach in entry.key_achievements:
                        self._bullet(doc, ach)

                if entry.relevant_projects:
                    p = doc.add_paragraph()
                    run = p.add_run("관련 프로젝트")
                    run.bold = True
                    run.font.size = Pt(9)
                    for proj in entry.relevant_projects:
                        self._bullet(doc, proj)

                doc.add_paragraph()

        buf = BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf
