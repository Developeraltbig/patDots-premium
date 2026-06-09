import React, { useState, useEffect } from "react";
import axios from "../../store/axios";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { PDFDocument } from "pdf-lib";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import "../../styles/dashboard/USPTOFormGenerator.css";
import { FileText, Plus, Trash2, CheckCircle2 } from "lucide-react";

// --- ICONS ---
const FileTextIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

// ============================================================================
// 1. UTILITIES & HELPERS (Ported directly from project2 server.js)
// ============================================================================
const PROVISIONAL_FEES = { micro: 65, small: 130, large: 325 };
const todayISO = () => new Date().toISOString().slice(0, 10);

const clean = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};
const yes = (value) => clean(value).toLowerCase() === "yes";
const formatDateUS = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = String(dateStr).split("-");
  if (!year || !month || !day) return String(dateStr);
  return `${month}/${day}/${year}`;
};
const stripSlashes = (name) =>
  clean(name)
    .replace(/^\/+|\/+$/g, "")
    .trim();
const fullName = (person = {}) =>
  [
    person.prefix,
    person.givenName,
    person.middleName,
    person.familyName,
    person.suffix,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
const inventorLegalName = (person = {}) =>
  [person.givenName, person.middleName, person.familyName, person.suffix]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
const firstNamedInventor = (inventors = []) => fullName(inventors[0] || {});
const toEsignature = (name) => {
  const n = stripSlashes(name);
  return n ? `/${n}/` : "";
};
const safeFilePart = (value, fallback = "file") =>
  clean(value || fallback)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || fallback;
const isAssigneeLikeApplicant = (type) =>
  [
    "assignee",
    "obligationToAssign",
    "legalRepresentative",
    "proprietaryInterest",
  ].includes(clean(type));
const drawingSheets = (fd) =>
  yes(fd.hasDrawings)
    ? clean(fd.numberOfDrawingSheets || fd.totalDrawingSheets)
    : "";
const makeId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const addPdfHelpers = (form) => {
  const setText = (name, value) => {
    try {
      form.getTextField(name).setText(clean(value));
    } catch (_) {}
  };
  const check = (name, shouldCheck = true) => {
    try {
      const cb = form.getCheckBox(name);
      if (shouldCheck) cb.check();
      else cb.uncheck();
    } catch (_) {}
  };
  return { setText, check };
};

// Docxtemplater ADS cleanup
function normalizeDocxTemplateTags(zip) {
  const xmlFiles = Object.keys(zip.files).filter((name) =>
    name.endsWith(".xml"),
  );
  for (const name of xmlFiles) {
    const file = zip.file(name);
    if (!file) continue;
    const xml = file.asText().replace(/\$\{([^{}]+)\}/g, "{$1}");
    zip.file(name, xml);
  }
  return zip;
}

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function USPTOFormGenerator({ patentData, setPatentData }) {
  // --- STATE ---
  const [formData, setFormData] = useState({
    filingType: "provisional",
    titleOfInvention: "",
    docketNumber: "",
    applicationNumber: "",
    filingDate: todayISO(),
    entityStatus: "micro",
    specificationPages: "",
    hasDrawings: "yes",
    numberOfDrawingSheets: "",
    subjectMatter: "Utility",
    declarationMode: "attachedApplication",
    declarationPages: "",
    suggestedFigureForPublication: "",
    useCustomerNumber: "no",
    customerNumber: "",
    correspondenceName: "",
    correspondenceAddress1: "",
    correspondenceAddress2: "",
    correspondenceCity: "",
    correspondenceState: "",
    correspondencePostalCode: "",
    correspondenceCountry: "United States",
    correspondenceEmail: "",
    correspondencePhone: "",
    additionalCorrespondenceEmails: "",
    requestEarlyPublicationFlag: "No",
    nonpublicationRequestFlag: "No",
    pdxOptOut: "No",
    epoSearchResultsOptOut: "No",
    applicantType: "inventor",
    applicantIsOrganization: "no",
    applicantName: "",
    assignmentPapersAttached: "no",
    include373Statement: "no",
    includePOA: "yes",
    poaAppointmentType: "customerNumber",
    representativeCustomerNumber: "",
    representativeRegistrationNumber: "",
    signatureName: "",
    signatureDate: todayISO(),
    signerRole: "",
    signerTitle: "",
  });

  const [inventors, setInventors] = useState([
    {
      id: makeId(),
      residenceCountry: "United States",
      mailingCountry: "United States",
    },
  ]);
  const [domesticBenefits, setDomesticBenefits] = useState([]);
  const [foreignPriorities, setForeignPriorities] = useState([]);
  const [practitioners, setPractitioners] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- POPULATE DATA FROM DB ON LOAD ---
  useEffect(() => {
    if (patentData) {
      // We map from patentData.indiaForm since the schema keys were merged
      const saved = patentData.indiaForm || {};
      setFormData((prev) => ({
        ...prev,
        ...saved,
        titleOfInvention:
          saved.title || patentData.sections?.title?.content || "",
        filingType:
          patentData.draftType === "nonprovisional"
            ? "nonprovisional"
            : "provisional",
        docketNumber: saved.docketNumber || saved.DOC_NO || "",
        correspondenceEmail:
          saved.correspondence?.email || patentData.userEmail || "",
        filingDate: saved.deposit_date || saved.filingDate || todayISO(),
      }));

      if (saved.inventors?.length > 0) {
        setInventors(
          saved.inventors.map((inv) => ({
            id: makeId(),
            givenName: inv.givenName || inv.name?.split(" ")[0] || "",
            familyName:
              inv.familyName || inv.name?.split(" ").slice(1).join(" ") || "",
            residenceCountry: inv.residence_country || "United States",
            residenceCity: inv.city || "",
            residenceState: inv.state || "",
            citizenship: inv.citizen_country || "",
            mailingAddress1: inv.address || "",
            mailingCountry: "United States",
          })),
        );
      }
      if (saved.priorities?.length > 0) {
        setForeignPriorities(
          saved.priorities.map((p) => ({
            id: makeId(),
            foreignCountry: p.country,
            foreignApplicationNumber: p.priority_no,
            foreignFilingDate: p.priority_date,
          })),
        );
      }
    }
  }, [patentData]);

  // --- EVENT HANDLERS ---
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleArrayChange = (setter, id, field, value) => {
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };
  const addArrayItem = (setter, defaultObj) =>
    setter((prev) => [...prev, { id: makeId(), ...defaultObj }]);
  const removeArrayItem = (setter, id) =>
    setter((prev) => prev.filter((item) => item.id !== id));

  // --- SAVE FORM STATE TO BACKEND ---
  const handleSaveForm = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        DOC_NO: formData.docketNumber,
        title: formData.titleOfInvention,
        deposit_date: formData.filingDate,
        inventors: inventors.map((inv) => ({
          ...inv,
          name: `${inv.givenName} ${inv.familyName}`,
          residence_country: inv.residenceCountry,
        })),
        priorities: foreignPriorities.map((f) => ({
          country: f.foreignCountry,
          priority_no: f.foreignApplicationNumber,
          priority_date: f.foreignFilingDate,
        })),
      };
      const res = await axios.put(
        `/api/patents/${patentData.draftId}/uspto-form`,
        payload,
      );
      setPatentData((prev) => ({ ...prev, indiaForm: res.data.indiaForm }));
      toast.success("Progress saved successfully!");
    } catch (err) {
      toast.error("Failed to save progress.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // 3. PDF/DOCX GENERATION ENGINE (Ported from Project 2 server.js)
  // ============================================================================
  const fetchTemplate = async (name) => {
    const res = await fetch(`/templates/${name}`);
    if (!res.ok) throw new Error(`Template not found: ${name}`);
    return await res.arrayBuffer();
  };

  const fillSB16 = async () => {
    const pdfDoc = await PDFDocument.load(
      await fetchTemplate("Cover-Sheet.pdf"),
      { ignoreEncryption: true },
    );
    const { setText, check } = addPdfHelpers(pdfDoc.getForm());

    inventors.slice(0, 5).forEach((inv, i) => {
      const row = i + 1;
      setText(
        `Given Name first and middle if anyRow${row}`,
        [inv.givenName, inv.middleName].filter(Boolean).join(" "),
      );
      setText(`Family Name or SurnameRow${row}`, inv.familyName);
      setText(
        `Residence City and either State or Foreign CountryRow${row}`,
        [inv.residenceCity, inv.residenceState, inv.residenceCountry]
          .filter(Boolean)
          .join(", "),
      );
    });

    if (inventors.length > 5)
      setText(
        "Additional inventors are being named on the",
        String(inventors.length - 5),
      );
    setText(
      "TITLE OF THE INVENTION 500 characters maxRow1",
      formData.titleOfInvention,
    );

    if (yes(formData.useCustomerNumber) && formData.customerNumber) {
      check("The address corresponding to Customer Number", true);
      setText("CORRESPONDENCE ADDRESS", formData.customerNumber);
    } else {
      check("undefined", true);
      setText("Firm or Individual Name", formData.correspondenceName);
      setText(
        "Address",
        [formData.correspondenceAddress1, formData.correspondenceAddress2]
          .filter(Boolean)
          .join(", "),
      );
      setText("City", formData.correspondenceCity);
      setText("State", formData.correspondenceState);
      setText("zip code", formData.correspondencePostalCode);
      setText("Country", formData.correspondenceCountry);
      setText("Telephone_2", formData.correspondencePhone);
      setText("Email_2", formData.correspondenceEmail);
    }

    setText("DATE", formatDateUS(formData.signatureDate));
    setText("TYPED OR PRINTED NAME", stripSlashes(formData.signatureName));
    setText("TELEPHONE", formData.correspondencePhone);
    setText("DOCKET NUMBER", formData.docketNumber);
    setText("signature", toEsignature(formData.signatureName));

    setText("Number of Pages", formData.specificationPages);
    setText("Number of Sheets", drawingSheets(formData));
    setText(
      "TOTAL FEE AMOUNT",
      `$${PROVISIONAL_FEES[formData.entityStatus] || 65}`,
    );

    check("ME", formData.entityStatus === "micro");
    check("SE", formData.entityStatus === "small");
    check("Drawings", yes(formData.hasDrawings));
    check(
      "Specification eg description of the invention",
      !!clean(formData.specificationPages),
    );
    check("No", true);

    try {
      pdfDoc.getForm().updateFieldAppearances();
    } catch (_) {}
    return await pdfDoc.save();
  };

  const fillMicroEntity = async (inv) => {
    const pdfDoc = await PDFDocument.load(
      await fetchTemplate("Micro-Entity.pdf"),
      { ignoreEncryption: true },
    );
    const { setText, check } = addPdfHelpers(pdfDoc.getForm());
    const signerName = inv
      ? inventorLegalName(inv)
      : stripSlashes(formData.signatureName);

    setText(
      "Application Number or Control Number if applicable",
      formData.applicationNumber,
    );
    setText("First Named Inventor", firstNamedInventor(inventors));
    setText("Title of Invention", formData.titleOfInvention);
    setText("Signature", toEsignature(signerName));
    setText("Name", signerName);
    setText("Date", formatDateUS(inv?.signatureDate || formData.signatureDate));
    setText("Telephone", formData.correspondencePhone);

    check(
      "There is more than one inventor and I am one of the inventors who are jointly identified as the applicant. The required additional certification form(s) signed by the other joint inventor(s) are included with this form",
      inventors.length > 1,
    );
    try {
      pdfDoc.getForm().updateFieldAppearances();
    } catch (_) {}
    return await pdfDoc.save();
  };

  const fillPOA = async (opts) => {
    const pdfDoc = await PDFDocument.load(await fetchTemplate("POA.pdf"), {
      ignoreEncryption: true,
    });
    const { setText, check } = addPdfHelpers(pdfDoc.getForm());
    const filingDateUS = formatDateUS(formData.filingDate);

    setText("Application Number", formData.applicationNumber);
    setText("Filing Date", filingDateUS);
    setText("First Named Inventor", firstNamedInventor(inventors));
    setText("Title", formData.titleOfInvention);
    setText("Attorney Docket Number", formData.docketNumber);
    setText("Signature", toEsignature(opts.signerName));
    setText(
      "Date Optional",
      formatDateUS(opts.signatureDate || formData.signatureDate),
    );
    setText("Name", opts.signerName);
    setText("Registration Number", formData.representativeRegistrationNumber);
    setText(
      "Title if Applicant is a juristic entity",
      opts.applicantType === "inventor" ? "" : opts.signerTitle,
    );
    setText(
      "Applicant Name if Applicant is a juristic entity",
      opts.applicantName,
    );
    check("Number of forms being submitted", true);
    setText("Number of forms", "1");

    setText("Application Number on 82B", formData.applicationNumber);
    setText("Filing Date on 82B", filingDateUS);

    if (
      formData.poaAppointmentType === "customerNumber" &&
      formData.representativeCustomerNumber
    ) {
      check("Appoint attorneys listed under customer number", true);
      setText("Customer Number", formData.representativeCustomerNumber);
      try {
        if (pdfDoc.getPageCount() >= 4) pdfDoc.removePage(2);
      } catch (_) {}
    } else {
      check("Appoint attorneys listed on the attached list", true);
      practitioners.slice(0, 10).forEach((p, i) => {
        setText(`NameRow${i + 1}`, p.name);
        setText(`Registration NumberRow${i + 1}`, p.registrationNumber);
      });
    }

    check("Box for Firm or Individual Name", true);
    setText("Firm or Individual Name", formData.correspondenceName);
    setText(
      "Street Address",
      [formData.correspondenceAddress1, formData.correspondenceAddress2]
        .filter(Boolean)
        .join(", "),
    );
    setText("City", formData.correspondenceCity);
    setText("State_2", formData.correspondenceState);
    setText("Zip", formData.correspondencePostalCode);
    setText("Country", formData.correspondenceCountry || "United States");
    setText("Telephone Number", formData.correspondencePhone);
    setText("Email Address", formData.correspondenceEmail);

    check("Inventor or Joint inventor", opts.applicantType === "inventor");
    check("Assignee", isAssigneeLikeApplicant(opts.applicantType));
    setText(
      "Applicant Name (if applicant is a juristic entity)",
      opts.applicantName,
    );
    setText(
      "Signature of the applicant for patent",
      toEsignature(opts.signerName),
    );
    setText(
      "Date Optional_2",
      formatDateUS(opts.signatureDate || formData.signatureDate),
    );
    setText("Name of the Signer", opts.signerName);
    setText("Title of the Signer", opts.signerTitle);
    check("Total number of forms are submitted", true);
    setText("Number of Forms", "1");

    try {
      pdfDoc.getForm().updateFieldAppearances();
    } catch (_) {}
    return await pdfDoc.save();
  };

  const fillTransmittal = async () => {
    const pdfDoc = await PDFDocument.load(
      await fetchTemplate("Transmittal.pdf"),
      { ignoreEncryption: true },
    );
    const { setText, check } = addPdfHelpers(pdfDoc.getForm());

    setText("Attorney Docket No", formData.docketNumber);
    setText("First Named Inventor", firstNamedInventor(inventors));
    setText("Title", formData.titleOfInvention);

    check("Check Box55", formData.entityStatus === "small");
    check("Check Box56", formData.entityStatus === "micro");
    check("Check Box57", !!clean(formData.specificationPages));
    check("Check Box58", yes(formData.hasDrawings));
    check("Check Box59", true);
    check("Check Box61", true);

    setText("Total Pages", formData.specificationPages);
    setText("Total Sheets", drawingSheets(formData));
    setText(
      "Total Pages_2",
      formData.declarationPages || String(Math.max(1, inventors.length) * 2),
    );

    check("Check Box69", yes(formData.include373Statement));
    if (yes(formData.includePOA)) check("Check Box70", true);

    if (yes(formData.assignmentPapersAttached)) {
      check("Check Box68", true);
      setText("Name of Assignee 1", formData.applicantName);
    }

    if (yes(formData.useCustomerNumber) && formData.customerNumber) {
      check("Check Box79", true);
      setText(
        "The address associated with Customer Number",
        formData.customerNumber,
      );
    } else {
      check("Check Box80", true);
      setText("Name", formData.correspondenceName);
      setText(
        "Address",
        [formData.correspondenceAddress1, formData.correspondenceAddress2]
          .filter(Boolean)
          .join(", "),
      );
      setText("City", formData.correspondenceCity);
      setText("State", formData.correspondenceState);
      setText("Zip Code", formData.correspondencePostalCode);
      setText("Country", formData.correspondenceCountry || "United States");
      setText("Telephone", formData.correspondencePhone);
      setText("Email", formData.correspondenceEmail);
    }

    setText("Signature", toEsignature(formData.signatureName));
    setText("Date", formatDateUS(formData.signatureDate));
    setText("Name PrintType", stripSlashes(formData.signatureName));
    setText(
      "Registration No AttorneyAgent",
      formData.representativeRegistrationNumber,
    );

    try {
      pdfDoc.getForm().updateFieldAppearances();
    } catch (_) {}
    return await pdfDoc.save();
  };

  const fillDeclaration = async (inv) => {
    const pdfDoc = await PDFDocument.load(
      await fetchTemplate("Declaration.pdf"),
      { ignoreEncryption: true },
    );
    const { setText, check } = addPdfHelpers(pdfDoc.getForm());
    const signerName = inventorLegalName(inv);

    setText("Title of Invention", formData.titleOfInvention);
    if (
      formData.declarationMode === "existingApplication" &&
      formData.applicationNumber
    ) {
      check("undefined", true);
      setText(
        "United States application or PCT international application number",
        formData.applicationNumber,
      );
      setText("filed on", formatDateUS(formData.filingDate));
    } else {
      check("This declaration", true);
    }

    setText("Inventor", signerName);
    setText(
      "Date Optional",
      formatDateUS(inv.signatureDate || formData.signatureDate),
    );
    setText("Text4", toEsignature(signerName));

    try {
      pdfDoc.getForm().updateFieldAppearances();
    } catch (_) {}
    return await pdfDoc.save();
  };

  const fillADS = async () => {
    const zip = normalizeDocxTemplateTags(
      new PizZip(await fetchTemplate("ADS.docx")),
    );
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });

    const dBenefits = domesticBenefits
      .filter((d) => clean(d.priorApplicationNumber || d.applicationNumber))
      .map((d) => ({
        priorApplicationStatus: d.priorApplicationStatus || "Pending",
        applicationNumber: d.applicationNumber || "",
        continuityType: d.continuityType || "Provisional",
        priorApplicationNumber: d.priorApplicationNumber,
        priorFilingDate: d.priorFilingDate,
      }));

    const fPriorities = foreignPriorities
      .filter((f) => clean(f.foreignApplicationNumber || f.foreignCountry))
      .map((f) => ({
        foreignApplicationNumber: f.foreignApplicationNumber,
        foreignCountry: f.foreignCountry,
        foreignFilingDate: f.foreignFilingDate,
        foreignAccessCode: f.foreignAccessCode,
      }));

    doc.render({
      applicationType:
        formData.filingType === "nonprovisional"
          ? "Nonprovisional Utility"
          : "Provisional",
      attorneyDocketNumber: formData.docketNumber,
      applicationNumber:
        formData.applicationNumber || "Not yet assigned (new filing)",
      titleOfInvention: formData.titleOfInvention,
      generatedDate: todayISO(),
      filingContext: "New non-provisional utility application package",
      secrecyOrderFlag: "No",

      inventors: inventors.map((inv, i) => ({
        inventorNumber: i + 1,
        prefix: inv.prefix,
        givenName: inv.givenName,
        middleName: inv.middleName,
        familyName: inv.familyName,
        suffix: inv.suffix,
        residenceStatus: (inv.residenceCountry || "")
          .toLowerCase()
          .includes("united states")
          ? "US Residency"
          : "Non-US Residency",
        citizenship: inv.citizenship,
        residenceCity: inv.residenceCity,
        residenceState: inv.residenceState,
        residenceCountry: inv.residenceCountry || "United States",
        activeUSMilitaryService: "No",
        mailingAddress1: inv.mailingAddress1 || formData.correspondenceAddress1,
        mailingAddress2: inv.mailingAddress2 || formData.correspondenceAddress2,
        mailingCity: inv.mailingCity || formData.correspondenceCity,
        mailingState: inv.mailingState || formData.correspondenceState,
        mailingPostalCode:
          inv.mailingPostalCode || formData.correspondencePostalCode,
        mailingCountry:
          inv.mailingCountry ||
          formData.correspondenceCountry ||
          "United States",
        inventorEmail: inv.inventorEmail,
        inventorPhone: inv.inventorPhone,
      })),

      useCustomerNumber: yes(formData.useCustomerNumber) ? "Yes" : "No",
      customerNumber: formData.customerNumber,
      correspondenceName: formData.correspondenceName,
      correspondenceAddress1: formData.correspondenceAddress1,
      correspondenceAddress2: formData.correspondenceAddress2,
      correspondenceCity: formData.correspondenceCity,
      correspondenceState: formData.correspondenceState,
      correspondencePostalCode: formData.correspondencePostalCode,
      correspondenceCountry: formData.correspondenceCountry || "United States",
      correspondenceEmail: formData.correspondenceEmail,
      correspondencePhone: formData.correspondencePhone,
      additionalCorrespondenceEmails: formData.additionalCorrespondenceEmails,

      subjectMatter: formData.subjectMatter || "Utility",
      entityStatus: formData.entityStatus,
      smallEntityClaimed: ["small", "micro"].includes(formData.entityStatus)
        ? "Yes"
        : "No",
      microEntityClaimed: formData.entityStatus === "micro" ? "Yes" : "No",
      totalDrawingSheets: drawingSheets(formData),
      suggestedFigureForPublication: formData.suggestedFigureForPublication,

      requestEarlyPublicationFlag: formData.requestEarlyPublicationFlag || "No",
      nonpublicationRequestFlag: formData.nonpublicationRequestFlag || "No",

      representativeType: formData.poaAppointmentType || "",
      representativeCustomerNumber: formData.representativeCustomerNumber,
      representativeRegistrationNumber:
        formData.representativeRegistrationNumber,
      additionalPractitioners: practitioners
        .filter((p) => clean(p.name))
        .map(
          (p) =>
            `${p.name}${p.registrationNumber ? ` (${p.registrationNumber})` : ""}`,
        )
        .join("; "),

      domesticBenefits: dBenefits.length
        ? dBenefits
        : [
            {
              priorApplicationStatus: "None — no domestic benefit.",
              applicationNumber: "N/A",
              continuityType: "N/A",
              priorApplicationNumber: "N/A",
              priorFilingDate: "N/A",
            },
          ],
      foreignPriorities: fPriorities.length
        ? fPriorities
        : [
            {
              foreignApplicationNumber: "None — no foreign priority.",
              foreignCountry: "N/A",
              foreignFilingDate: "N/A",
              foreignAccessCode: "N/A",
            },
          ],
      hasForeignPriority: fPriorities.length ? "Yes" : "No",
      aiaTransitionStatementApplies: "No",
      pdxOptOut: formData.pdxOptOut || "No",
      epoSearchResultsOptOut: formData.epoSearchResultsOptOut || "No",

      applicants:
        formData.applicantType === "inventor"
          ? [
              {
                applicantType: "Inventor(s) listed above are the applicant(s)",
                applicantIsOrganization: "No",
                applicantName: "N/A",
                authorityToFile: "N/A",
                relatedInventorName: "N/A",
                applicantAddress1: "N/A",
                applicantCity: "N/A",
                applicantState: "N/A",
                applicantPostalCode: "N/A",
                applicantCountry: "N/A",
              },
            ]
          : [
              {
                applicantType: formData.applicantType,
                applicantIsOrganization: yes(formData.applicantIsOrganization)
                  ? "Yes"
                  : "No",
                applicantName: formData.applicantName,
                applicantAddress1: formData.correspondenceAddress1,
                applicantCity: formData.correspondenceCity,
                applicantState: formData.correspondenceState,
                applicantPostalCode: formData.correspondencePostalCode,
                applicantCountry:
                  formData.correspondenceCountry || "United States",
              },
            ],
      assignees:
        formData.applicantType === "assignee"
          ? [
              {
                assigneeName: formData.applicantName,
                assigneeAddress1: formData.correspondenceAddress1,
                assigneeCity: formData.correspondenceCity,
                assigneeState: formData.correspondenceState,
                assigneePostalCode: formData.correspondencePostalCode,
                assigneeCountry:
                  formData.correspondenceCountry || "United States",
              },
            ]
          : [
              {
                assigneeName: "None",
                assigneeAddress1: "N/A",
                assigneeCity: "N/A",
                assigneeState: "N/A",
                assigneePostalCode: "N/A",
                assigneeCountry: "N/A",
              },
            ],

      signature: toEsignature(formData.signatureName),
      signatureDate: formData.signatureDate,
      signatureFirstName: stripSlashes(formData.signatureName).split(/\s+/)[0],
      signatureLastName: stripSlashes(formData.signatureName)
        .split(/\s+/)
        .slice(1)
        .join(" "),
      signatureRegistrationNumber: formData.representativeRegistrationNumber,
      signerRole:
        formData.signerRole ||
        (formData.representativeRegistrationNumber
          ? "Patent Practitioner"
          : "Applicant / Inventor"),
    });

    return doc
      .getZip()
      .generate({ type: "arraybuffer", compression: "DEFLATE" });
  };

  // --- ZIP BUNDLING HELPER LOGIC (Exact parity with Project 2) ---
  const appendMicroEntityCertificates = async (zip, basePrefix) => {
    if (formData.entityStatus !== "micro") return;

    if (inventors.length <= 1) {
      const microBytes = await fillMicroEntity(inventors[0]);
      zip.file(
        `${basePrefix}-Micro-Entity-Certification-SB15A.pdf`,
        microBytes,
      );
      return;
    }

    for (let i = 0; i < inventors.length; i += 1) {
      const microBytes = await fillMicroEntity(inventors[i]);
      zip.file(
        `${basePrefix}-Micro-Entity-Certification-SB15A-${i + 1}-${safeFilePart(inventorLegalName(inventors[i]), `Inventor-${i + 1}`)}.pdf`,
        microBytes,
      );
    }
  };

  const appendPOAFiles = async (zip, basePrefix) => {
    // Default to 'yes' if undefined
    if ((formData.includePOA || "yes") === "no") return;

    const applicantType = formData.applicantType || "inventor";

    // If applicants are inventors and there are multiple, generate one POA per inventor
    if (applicantType === "inventor" && inventors.length > 1) {
      for (let i = 0; i < inventors.length; i += 1) {
        const signerName = inventorLegalName(inventors[i]);
        const poaBytes = await fillPOA({
          applicantType: "inventor",
          signerName,
          signerTitle: "Inventor",
          signatureDate: inventors[i].signatureDate || formData.signatureDate,
        });
        zip.file(
          `${basePrefix}-Power-of-Attorney-AIA82-${i + 1}-${safeFilePart(signerName, `Inventor-${i + 1}`)}.pdf`,
          poaBytes,
        );
      }
      return;
    }

    // Otherwise, generate a single POA for the entity/single-inventor
    const signerName =
      applicantType === "inventor"
        ? inventorLegalName(inventors[0])
        : stripSlashes(formData.signatureName);

    const poaBytes = await fillPOA({
      applicantType,
      signerName,
      signerTitle:
        applicantType === "inventor" ? "Inventor" : formData.signerTitle,
      applicantName: formData.applicantName || formData.assigneeName,
    });
    zip.file(`${basePrefix}-Power-of-Attorney-AIA82.pdf`, poaBytes);
  };

  // --- MASTER ZIP BUNDLING ---
  const handleGenerateZIP = async (e) => {
    e.preventDefault();
    if (!formData.titleOfInvention || !inventors[0]?.givenName) {
      return toast.error("Title and at least one Inventor name are required.");
    }

    await handleSaveForm(); // Auto-save
    setIsGenerating(true);
    const zip = new JSZip();
    const docketLabel = safeFilePart(
      formData.docketNumber || formData.titleOfInvention || "USPTO-Forms",
      "USPTO-Forms",
    );

    try {
      if (formData.filingType === "provisional") {
        zip.file("1-Provisional-Cover-Sheet-SB16.pdf", await fillSB16());
        await appendMicroEntityCertificates(zip, "2");
        await appendPOAFiles(zip, "3");
      } else {
        // Non-Provisional
        zip.file("1-Utility-Transmittal-AIA15.pdf", await fillTransmittal());

        for (let i = 0; i < inventors.length; i += 1) {
          const declarationBytes = await fillDeclaration(inventors[i]);
          zip.file(
            `2-Declaration-AIA01-${i + 1}-${safeFilePart(inventorLegalName(inventors[i]), `Inventor-${i + 1}`)}.pdf`,
            declarationBytes,
          );
        }

        await appendMicroEntityCertificates(zip, "3");
        await appendPOAFiles(zip, "4");

        // Use arraybuffer to securely pass docxtemplater data into JSZip
        const adsBytes = await fillADS();
        zip.file("5-ADS-Patent-Center-Entry-Sheet.docx", adsBytes);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `USPTO-${formData.filingType}-${docketLabel}.zip`);
      toast.success("USPTO Forms generated successfully!");
    } catch (err) {
      console.error("ZIP Generation Error: ", err);
      toast.error(`Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isNonProv = formData.filingType === "nonprovisional";

  // ============================================================================
  // 4. RENDER UI (Faithful to Project 2 index.html & CSS)
  // ============================================================================
  return (
    <div className="form-generator-container fg-shell">
      <div className="fg-header">
        <div className="fg-header-row">
          <div>
            <h1 id="pageTitle">USPTO Form Generator</h1>
            <p id="pageSubtitle">
              Single guided UI form for provisional and non-provisional USPTO
              packages.
            </p>
            <p id="headerSubtext" className="fg-header-subtext">
              {isNonProv
                ? "Non-provisional: Transmittal + Declarations + Micro Entity + POA + ADS DOCX"
                : "Provisional: Cover Sheet + Micro Entity + POA"}
            </p>
          </div>
          <div id="headerBadges" className="fg-badges">
            {isNonProv ? (
              <>
                <span
                  className="badge bg-indigo-50 text-indigo-700"
                  style={{ color: "#4338ca" }}
                >
                  AIA/15
                </span>
                <span
                  className="badge bg-sky-50 text-sky-700"
                  style={{ color: "#0369a1" }}
                >
                  AIA/01
                </span>
                <span
                  className="badge bg-violet-50 text-violet-700"
                  style={{ color: "#6d28d9" }}
                >
                  Micro Entity
                </span>
                <span
                  className="badge bg-emerald-50 text-emerald-700"
                  style={{ color: "#047857" }}
                >
                  POA
                </span>
                <span
                  className="badge bg-amber-50 text-amber-700"
                  style={{ color: "#b45309" }}
                >
                  ADS DOCX
                </span>
              </>
            ) : (
              <>
                <span
                  className="badge bg-blue-50 text-blue-700"
                  style={{ color: "#1d4ed8" }}
                >
                  SB16
                </span>
                <span
                  className="badge bg-violet-50 text-violet-700"
                  style={{ color: "#6d28d9" }}
                >
                  Micro Entity
                </span>
                <span
                  className="badge bg-emerald-50 text-emerald-700"
                  style={{ color: "#047857" }}
                >
                  POA
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerateZIP}>
        <div className="fg-card">
          {/* 1. Filing Package */}
          <div className="section-card fg-section">
            <h3 className="section-title">1. Filing Package</h3>
            <div className="fg-package-grid">
              <div
                className={`toggle-card ${!isNonProv ? "active" : ""}`}
                onClick={() =>
                  setFormData((p) => ({ ...p, filingType: "provisional" }))
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold flex items-center">
                      <span className="toggle-dot"></span>Provisional
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Cover Sheet + Micro Entity if selected + POA if enabled.
                    </p>
                  </div>
                  <span
                    className="badge bg-blue-100 text-blue-700"
                    style={{ color: "#1d4ed8" }}
                  >
                    dynamic ZIP
                  </span>
                </div>
              </div>
              <div
                className={`toggle-card ${isNonProv ? "active" : ""}`}
                onClick={() =>
                  setFormData((p) => ({ ...p, filingType: "nonprovisional" }))
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold flex items-center">
                      <span className="toggle-dot"></span>Non-Provisional
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Transmittal + Declaration(s) + Micro Entity + POA + ADS
                      DOCX.
                    </p>
                  </div>
                  <span
                    className="badge bg-indigo-100 text-indigo-700"
                    style={{ color: "#4338ca" }}
                  >
                    5 document types
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Application Information */}
          <div className="section-card fg-section">
            <h3 className="section-title">2. Application Information</h3>
            <div className="fg-grid">
              <div className="md:col-span-2">
                <label className="form-label">
                  Title of Invention <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input"
                  name="titleOfInvention"
                  value={formData.titleOfInvention}
                  onChange={handleChange}
                  required
                  placeholder="Enter title of invention"
                  maxLength="500"
                />
              </div>
              <div>
                <label className="form-label">Attorney Docket Number</label>
                <input
                  className="form-input"
                  name="docketNumber"
                  value={formData.docketNumber}
                  onChange={handleChange}
                  placeholder="Internal reference / docket no."
                />
              </div>
              <div>
                <label className="form-label">Application Number</label>
                <input
                  className="form-input"
                  name="applicationNumber"
                  value={formData.applicationNumber}
                  onChange={handleChange}
                  placeholder="Usually blank for a new filing"
                />
                <p className="form-hint">
                  {!isNonProv
                    ? "Leave blank for a new provisional filing before USPTO assigns an application number."
                    : "Usually blank for a brand-new non-provisional filing."}
                </p>
              </div>
              <div>
                <label className="form-label">Filing Date</label>
                <input
                  type="date"
                  className="form-input"
                  name="filingDate"
                  value={formData.filingDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Entity Status</label>
                <select
                  className="form-select"
                  name="entityStatus"
                  value={formData.entityStatus}
                  onChange={handleChange}
                >
                  <option value="micro">Micro Entity</option>
                  <option value="small">Small Entity</option>
                  <option value="large">Large Entity</option>
                </select>
              </div>
              <div>
                <label className="form-label">Specification Pages</label>
                <input
                  type="number"
                  className="form-input"
                  name="specificationPages"
                  value={formData.specificationPages}
                  onChange={handleChange}
                  min="0"
                  placeholder="Total pages"
                />
              </div>
              <div>
                <label className="form-label">Drawings Included?</label>
                <select
                  className="form-select"
                  name="hasDrawings"
                  value={formData.hasDrawings}
                  onChange={handleChange}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {yes(formData.hasDrawings) && (
                <div>
                  <label className="form-label">Number of Drawing Sheets</label>
                  <input
                    type="number"
                    className="form-input"
                    name="numberOfDrawingSheets"
                    value={formData.numberOfDrawingSheets}
                    onChange={handleChange}
                    min="0"
                    placeholder="Total sheets"
                  />
                </div>
              )}
              {isNonProv && (
                <>
                  <div>
                    <label className="form-label">Subject Matter</label>
                    <select
                      className="form-select"
                      name="subjectMatter"
                      value={formData.subjectMatter}
                      onChange={handleChange}
                    >
                      <option value="Utility">Utility</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      Declaration Directed To
                    </label>
                    <select
                      className="form-select"
                      name="declarationMode"
                      value={formData.declarationMode}
                      onChange={handleChange}
                    >
                      <option value="attachedApplication">
                        The attached application
                      </option>
                      <option value="existingApplication">
                        An application number already assigned
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      Declaration Total Pages
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      name="declarationPages"
                      value={formData.declarationPages}
                      onChange={handleChange}
                      min="1"
                      placeholder="Auto-calculated if blank"
                    />
                    <p className="form-hint">
                      Leave blank to use 2 pages per inventor declaration PDF.
                    </p>
                  </div>
                  <div>
                    <label className="form-label">
                      Suggested Figure for Publication
                    </label>
                    <input
                      className="form-input"
                      name="suggestedFigureForPublication"
                      value={formData.suggestedFigureForPublication}
                      onChange={handleChange}
                      placeholder="e.g. FIG. 1"
                    />
                  </div>
                </>
              )}
            </div>
            {formData.entityStatus === "micro" && (
              <div className="mt-4 flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
                <svg
                  className="w-4 h-4 text-violet-600 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-xs text-violet-700 mb-0">
                  {inventors.length > 1
                    ? "Micro Entity selected — a separate PTO/SB/15A certification will be generated for each inventor."
                    : "Micro Entity selected — PTO/SB/15A certification will be included in the ZIP."}
                </p>
              </div>
            )}
          </div>

          {/* 3. Inventors */}
          <div className="section-card fg-section">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
              <h3 className="section-title m-0 border-0 p-0">
                3. Inventors{" "}
                <span className="font-normal tracking-normal normal-case">
                  ({inventors.length})
                </span>
              </h3>
              <button
                type="button"
                className="fg-add-btn"
                onClick={() =>
                  addArrayItem(setInventors, {
                    residenceCountry: "United States",
                    mailingCountry: "United States",
                  })
                }
              >
                + Add Inventor
              </button>
            </div>
            <div>
              {inventors.map((inv, i) => (
                <div key={inv.id} className="mini-card inventor-card">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="font-bold text-sm">Inventor {i + 1}</div>
                    {inventors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem(setInventors, inv.id)}
                        className="text-xs text-red-600 font-bold hover:underline btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {isNonProv && (
                      <div>
                        <label className="form-label">Prefix</label>
                        <input
                          className="form-input"
                          value={inv.prefix || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setInventors,
                              inv.id,
                              "prefix",
                              e.target.value,
                            )
                          }
                          placeholder="Dr."
                        />
                      </div>
                    )}
                    <div>
                      <label className="form-label">
                        Given Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="form-input"
                        value={inv.givenName || ""}
                        onChange={(e) =>
                          handleArrayChange(
                            setInventors,
                            inv.id,
                            "givenName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    {isNonProv && (
                      <div>
                        <label className="form-label">Middle Name</label>
                        <input
                          className="form-input"
                          value={inv.middleName || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setInventors,
                              inv.id,
                              "middleName",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    )}
                    <div>
                      <label className="form-label">
                        Family Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="form-input"
                        value={inv.familyName || ""}
                        onChange={(e) =>
                          handleArrayChange(
                            setInventors,
                            inv.id,
                            "familyName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    {isNonProv && (
                      <div>
                        <label className="form-label">Suffix</label>
                        <input
                          className="form-input"
                          value={inv.suffix || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setInventors,
                              inv.id,
                              "suffix",
                              e.target.value,
                            )
                          }
                          placeholder="Jr."
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="form-label">
                        Residence City{" "}
                        {isNonProv && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        className="form-input"
                        value={inv.residenceCity || ""}
                        onChange={(e) =>
                          handleArrayChange(
                            setInventors,
                            inv.id,
                            "residenceCity",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Residence State / Province
                      </label>
                      <input
                        className="form-input"
                        value={inv.residenceState || ""}
                        onChange={(e) =>
                          handleArrayChange(
                            setInventors,
                            inv.id,
                            "residenceState",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Residence Country{" "}
                        {isNonProv && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        className="form-input"
                        value={inv.residenceCountry || "United States"}
                        onChange={(e) =>
                          handleArrayChange(
                            setInventors,
                            inv.id,
                            "residenceCountry",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  {isNonProv && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="form-label">Citizenship</label>
                          <input
                            className="form-input"
                            value={inv.citizenship || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "citizenship",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. United States"
                          />
                        </div>
                        <div>
                          <label className="form-label">Inventor Email</label>
                          <input
                            className="form-input"
                            value={inv.inventorEmail || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "inventorEmail",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="form-label">Inventor Phone</label>
                          <input
                            className="form-input"
                            value={inv.inventorPhone || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "inventorPhone",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="form-label">
                            Mailing Address 1
                          </label>
                          <input
                            className="form-input"
                            value={inv.mailingAddress1 || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "mailingAddress1",
                                e.target.value,
                              )
                            }
                            placeholder="Blank = use correspondence address"
                          />
                        </div>
                        <div>
                          <label className="form-label">
                            Mailing Address 2
                          </label>
                          <input
                            className="form-input"
                            value={inv.mailingAddress2 || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "mailingAddress2",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="form-label">Mailing City</label>
                          <input
                            className="form-input"
                            value={inv.mailingCity || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "mailingCity",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="form-label">
                            Mailing State / Postal / Country
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              className="form-input"
                              value={inv.mailingState || ""}
                              onChange={(e) =>
                                handleArrayChange(
                                  setInventors,
                                  inv.id,
                                  "mailingState",
                                  e.target.value,
                                )
                              }
                              placeholder="State"
                            />
                            <input
                              className="form-input"
                              value={inv.mailingPostalCode || ""}
                              onChange={(e) =>
                                handleArrayChange(
                                  setInventors,
                                  inv.id,
                                  "mailingPostalCode",
                                  e.target.value,
                                )
                              }
                              placeholder="Postal"
                            />
                            <input
                              className="form-input"
                              value={inv.mailingCountry || "United States"}
                              onChange={(e) =>
                                handleArrayChange(
                                  setInventors,
                                  inv.id,
                                  "mailingCountry",
                                  e.target.value,
                                )
                              }
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                        Declaration signature will be prepared as{" "}
                        <strong>
                          /{inventorLegalName(inv) || "Inventor Legal Name"}/
                        </strong>
                        . The final signer should verify before filing.
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="form-label">
                            Inventor Declaration Date
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            value={inv.signatureDate || ""}
                            onChange={(e) =>
                              handleArrayChange(
                                setInventors,
                                inv.id,
                                "signatureDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Correspondence Address */}
          <div className="section-card fg-section">
            <h3 className="section-title">4. Correspondence Address</h3>
            <div className="fg-grid">
              <div>
                <label className="form-label">Use Customer Number?</label>
                <select
                  className="form-select"
                  name="useCustomerNumber"
                  value={formData.useCustomerNumber}
                  onChange={handleChange}
                >
                  <option value="no">No, use address below</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="form-label">Customer Number</label>
                <input
                  className="form-input"
                  name="customerNumber"
                  value={formData.customerNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                />
                <p className="form-hint">
                  Use only if the filer has a valid USPTO correspondence
                  customer number; otherwise provide the address below.
                </p>
              </div>
              {!yes(formData.useCustomerNumber) && (
                <>
                  <div className="md:col-span-2">
                    <label className="form-label">
                      Firm or Individual Name
                    </label>
                    <input
                      className="form-input"
                      name="correspondenceName"
                      value={formData.correspondenceName}
                      onChange={handleChange}
                      placeholder="Firm name or individual name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Address Line 1</label>
                    <input
                      className="form-input"
                      name="correspondenceAddress1"
                      value={formData.correspondenceAddress1}
                      onChange={handleChange}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Address Line 2</label>
                    <input
                      className="form-input"
                      name="correspondenceAddress2"
                      value={formData.correspondenceAddress2}
                      onChange={handleChange}
                      placeholder="Suite / floor / optional"
                    />
                  </div>
                  <div>
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      name="correspondenceCity"
                      value={formData.correspondenceCity}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">State / Province</label>
                    <input
                      className="form-input"
                      name="correspondenceState"
                      value={formData.correspondenceState}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Postal Code</label>
                    <input
                      className="form-input"
                      name="correspondencePostalCode"
                      value={formData.correspondencePostalCode}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Country</label>
                    <input
                      className="form-input"
                      name="correspondenceCountry"
                      value={formData.correspondenceCountry}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      name="correspondenceEmail"
                      value={formData.correspondenceEmail}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      name="correspondencePhone"
                      value={formData.correspondencePhone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  {isNonProv && (
                    <div className="md:col-span-2">
                      <label className="form-label">
                        Additional Correspondence Email(s)
                      </label>
                      <input
                        className="form-input"
                        name="additionalCorrespondenceEmails"
                        value={formData.additionalCorrespondenceEmails}
                        onChange={handleChange}
                        placeholder="Optional; separate multiple emails with commas"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 5. ADS Priority / Publication Details (Non-Prov Only) */}
          {isNonProv && (
            <div className="section-card fg-section">
              <h3 className="section-title">
                5. ADS Priority / Publication Details
              </h3>
              <div className="fg-grid mb-4">
                <div>
                  <label className="form-label">
                    Request Early Publication?
                  </label>
                  <select
                    className="form-select"
                    name="requestEarlyPublicationFlag"
                    value={formData.requestEarlyPublicationFlag}
                    onChange={handleChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Request Not to Publish?</label>
                  <select
                    className="form-select"
                    name="nonpublicationRequestFlag"
                    value={formData.nonpublicationRequestFlag}
                    onChange={handleChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">PDX Access Opt-Out?</label>
                  <select
                    className="form-select"
                    name="pdxOptOut"
                    value={formData.pdxOptOut}
                    onChange={handleChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    EPO Search Results Opt-Out?
                  </label>
                  <select
                    className="form-select"
                    name="epoSearchResultsOptOut"
                    value={formData.epoSearchResultsOptOut}
                    onChange={handleChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Domestic Benefits */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">
                    Domestic Benefit / Prior U.S. Application
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem(setDomesticBenefits, {
                        priorApplicationStatus: "Pending",
                        continuityType: "Provisional",
                      })
                    }
                    className="fg-add-btn"
                  >
                    + Add
                  </button>
                </div>
                <p className="form-hint mb-3">
                  Use when the non-provisional claims benefit of a provisional
                  or earlier U.S. application.
                </p>
                {domesticBenefits.map((item, i) => (
                  <div
                    key={item.id}
                    className="mini-card domestic-benefit-card"
                  >
                    <div className="flex justify-between mb-3">
                      <strong className="text-sm">
                        Domestic Benefit {i + 1}
                      </strong>
                      <button
                        type="button"
                        onClick={() =>
                          removeArrayItem(setDomesticBenefits, item.id)
                        }
                        className="text-xs text-red-600 font-bold btn-remove hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="form-label">Status</label>
                        <input
                          className="form-input"
                          value={item.priorApplicationStatus || "Pending"}
                          onChange={(e) =>
                            handleArrayChange(
                              setDomesticBenefits,
                              item.id,
                              "priorApplicationStatus",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Continuity Type</label>
                        <input
                          className="form-input"
                          value={item.continuityType || "Provisional"}
                          onChange={(e) =>
                            handleArrayChange(
                              setDomesticBenefits,
                              item.id,
                              "continuityType",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Prior Application No.
                        </label>
                        <input
                          className="form-input"
                          value={item.priorApplicationNumber || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setDomesticBenefits,
                              item.id,
                              "priorApplicationNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Prior Filing Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={item.priorFilingDate || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setDomesticBenefits,
                              item.id,
                              "priorFilingDate",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Foreign Priorities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Foreign Priority</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem(setForeignPriorities, {})}
                    className="fg-add-btn"
                  >
                    + Add
                  </button>
                </div>
                {foreignPriorities.map((item, i) => (
                  <div
                    key={item.id}
                    className="mini-card foreign-priority-card"
                  >
                    <div className="flex justify-between mb-3">
                      <strong className="text-sm">
                        Foreign Priority {i + 1}
                      </strong>
                      <button
                        type="button"
                        onClick={() =>
                          removeArrayItem(setForeignPriorities, item.id)
                        }
                        className="text-xs text-red-600 font-bold btn-remove hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="form-label">Application No.</label>
                        <input
                          className="form-input"
                          value={item.foreignApplicationNumber || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setForeignPriorities,
                              item.id,
                              "foreignApplicationNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Country / IP Authority
                        </label>
                        <input
                          className="form-input"
                          value={item.foreignCountry || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setForeignPriorities,
                              item.id,
                              "foreignCountry",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Filing Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={item.foreignFilingDate || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setForeignPriorities,
                              item.id,
                              "foreignFilingDate",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Access Code</label>
                        <input
                          className="form-input"
                          value={item.foreignAccessCode || ""}
                          onChange={(e) =>
                            handleArrayChange(
                              setForeignPriorities,
                              item.id,
                              "foreignAccessCode",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Applicant / Assignee for ADS (Non-Prov Only) */}
          {isNonProv && (
            <div className="section-card fg-section">
              <h3 className="section-title">6. Applicant / Assignee for ADS</h3>
              <div className="fg-grid">
                <div>
                  <label className="form-label">Applicant Type</label>
                  <select
                    className="form-select"
                    name="applicantType"
                    value={formData.applicantType}
                    onChange={handleChange}
                  >
                    <option value="inventor">
                      Inventor(s) are the applicant(s)
                    </option>
                    <option value="assignee">
                      Assignee / company applicant
                    </option>
                    <option value="obligationToAssign">
                      Person/company inventor is obligated to assign to
                    </option>
                    <option value="legalRepresentative">
                      Legal representative
                    </option>
                    <option value="proprietaryInterest">
                      Person with sufficient proprietary interest
                    </option>
                  </select>
                  <p className="form-hint">
                    {formData.applicantType === "inventor"
                      ? "If POA is enabled and there are multiple inventors, the ZIP will include one POA per inventor."
                      : "If POA is enabled, one applicant/company POA will be generated and Signer Title is required."}
                  </p>
                </div>
                <div>
                  <label className="form-label">
                    Applicant is Organization?
                  </label>
                  <select
                    className="form-select"
                    name="applicantIsOrganization"
                    value={formData.applicantIsOrganization}
                    onChange={handleChange}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {formData.applicantType !== "inventor" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="form-label">
                        Applicant / Organization Name
                      </label>
                      <input
                        className="form-input"
                        name="applicantName"
                        value={formData.applicantName}
                        onChange={handleChange}
                        placeholder="Company, assignee, or applicant name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Applicant Address</label>
                      <input
                        className="form-input"
                        name="applicantAddress1"
                        value={formData.applicantAddress1}
                        onChange={handleChange}
                        placeholder="Address line 1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Applicant City</label>
                      <input
                        className="form-input"
                        name="applicantCity"
                        value={formData.applicantCity}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Applicant State / Province
                      </label>
                      <input
                        className="form-input"
                        name="applicantState"
                        value={formData.applicantState}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Applicant Postal Code
                      </label>
                      <input
                        className="form-input"
                        name="applicantPostalCode"
                        value={formData.applicantPostalCode}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="form-label">Applicant Country</label>
                      <input
                        className="form-input"
                        name="applicantCountry"
                        value={formData.applicantCountry || "United States"}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Assignment Papers Attached?
                      </label>
                      <select
                        className="form-select"
                        name="assignmentPapersAttached"
                        value={formData.assignmentPapersAttached}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                      <p className="form-hint">
                        Only select Yes if assignment papers are actually
                        included separately.
                      </p>
                    </div>
                    <div>
                      <label className="form-label">
                        37 CFR 3.73(c) Statement Attached?
                      </label>
                      <select
                        className="form-select"
                        name="include373Statement"
                        value={formData.include373Statement}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                      <p className="form-hint">
                        Only select Yes if that statement is actually included
                        separately.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 7. Power of Attorney / Representative */}
          <div className="section-card fg-section">
            <h3 className="section-title">
              {isNonProv
                ? "7. Power of Attorney / Representative"
                : "4. Power of Attorney / Representative"}
            </h3>
            <div className="fg-grid">
              <div>
                <label className="form-label">Generate POA?</label>
                <select
                  className="form-select"
                  name="includePOA"
                  value={formData.includePOA}
                  onChange={handleChange}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p className="form-hint">
                  Use only when appointing USPTO registered practitioner(s) or a
                  practitioner customer number.
                </p>
              </div>
              {yes(formData.includePOA) && (
                <>
                  <div>
                    <label className="form-label">Appointment Method</label>
                    <select
                      className="form-select"
                      name="poaAppointmentType"
                      value={formData.poaAppointmentType}
                      onChange={handleChange}
                    >
                      <option value="customerNumber">
                        Practitioners associated with Customer Number
                      </option>
                      <option value="practitionerList">
                        Named practitioner list
                      </option>
                    </select>
                  </div>
                  {formData.poaAppointmentType === "customerNumber" && (
                    <div>
                      <label className="form-label">
                        Representative Customer Number
                      </label>
                      <input
                        className="form-input"
                        name="representativeCustomerNumber"
                        value={formData.representativeCustomerNumber}
                        onChange={handleChange}
                        placeholder="USPTO customer number"
                      />
                      <p className="form-hint">
                        Use only a valid USPTO Customer Number associated with
                        the appointed registered practitioner(s).
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="form-label">
                      Representative Registration Number
                    </label>
                    <input
                      className="form-input"
                      name="representativeRegistrationNumber"
                      value={formData.representativeRegistrationNumber}
                      onChange={handleChange}
                      placeholder="Optional for signer / ADS"
                    />
                  </div>
                </>
              )}
            </div>

            {yes(formData.includePOA) && (
              <>
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {formData.applicantType === "inventor"
                    ? "POA signer logic: inventor-applicant POAs are signed using each inventor legal name. For multiple inventors, one POA per inventor is generated."
                    : "POA signer logic: company/assignee/legal-representative POA uses the Package Signer Name and Signer Title below."}
                </div>
                {formData.poaAppointmentType === "practitionerList" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">
                        Named Practitioners
                      </label>
                      <button
                        type="button"
                        onClick={() => addArrayItem(setPractitioners, {})}
                        className="fg-add-btn"
                      >
                        + Add Practitioner
                      </button>
                    </div>
                    {practitioners.map((item, i) => (
                      <div
                        key={item.id}
                        className="mini-card practitioner-card"
                      >
                        <div className="flex justify-between mb-3">
                          <strong className="text-sm">
                            Practitioner {i + 1}
                          </strong>
                          <button
                            type="button"
                            onClick={() =>
                              removeArrayItem(setPractitioners, item.id)
                            }
                            className="text-xs text-red-600 font-bold btn-remove hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="form-label">Name</label>
                            <input
                              className="form-input"
                              value={item.name || ""}
                              onChange={(e) =>
                                handleArrayChange(
                                  setPractitioners,
                                  item.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Registered practitioner name"
                            />
                          </div>
                          <div>
                            <label className="form-label">
                              Registration Number
                            </label>
                            <input
                              className="form-input"
                              value={item.registrationNumber || ""}
                              onChange={(e) =>
                                handleArrayChange(
                                  setPractitioners,
                                  item.id,
                                  "registrationNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 8. Signature */}
          <div className="section-card fg-section">
            <h3 className="section-title">
              {isNonProv ? "8. Signature" : "5. Signature"}
            </h3>
            <div className="fg-grid">
              <div>
                <label className="form-label">
                  Package / Transmittal Signer Name{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input"
                  name="signatureName"
                  value={formData.signatureName}
                  onChange={handleChange}
                  required
                  placeholder="Full name, e.g. Jane Doe"
                />
                <p className="form-hint">
                  The server formats it as /Name/ where needed. Declaration
                  signatures use each inventor's legal name.
                </p>
              </div>
              <div>
                <label className="form-label">Signature Date</label>
                <input
                  type="date"
                  className="form-input"
                  name="signatureDate"
                  value={formData.signatureDate}
                  onChange={handleChange}
                />
              </div>
              {isNonProv && (
                <>
                  <div>
                    <label className="form-label">Signer Role</label>
                    <input
                      className="form-input"
                      name="signerRole"
                      value={formData.signerRole}
                      onChange={handleChange}
                      placeholder="Applicant / Inventor / Patent Practitioner"
                    />
                  </div>
                  <div>
                    <label className="form-label">Signer Title</label>
                    <input
                      className="form-input"
                      name="signerTitle"
                      value={formData.signerTitle}
                      onChange={handleChange}
                      placeholder="Required if company/assignee signs POA"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fg-actions flex justify-between items-center mt-6">
            <div className="text-sm text-slate-500">
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving}
                className="btn-secondary mr-4"
              >
                {isSaving ? "Saving..." : "Save Progress"}
              </button>
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="btn-generate-zip flex items-center gap-2"
            >
              <FileTextIcon />
              {isGenerating
                ? "Generating ZIP..."
                : "Generate USPTO Package ZIP"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
