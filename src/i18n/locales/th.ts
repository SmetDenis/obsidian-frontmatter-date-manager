// Thai. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_TH: Strings = {
  common: {
    run: 'เรียกใช้',
    back: 'ย้อนกลับ',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    file: 'ไฟล์',
    created: 'สร้างเมื่อ',
    updated: 'แก้ไขล่าสุด',
    viewed: 'เปิดล่าสุด',
    createdKeyed: 'สร้างเมื่อ ({key})',
    updatedKeyed: 'แก้ไขล่าสุด ({key})',
    viewedKeyed: 'เปิดล่าสุด ({key})',
    scanAndPreview: 'สแกนและดูตัวอย่าง',
    scanningFiles: 'กำลังสแกนไฟล์…',
    doneWithErrors: 'เสร็จสิ้น มีข้อผิดพลาด {errors} รายการ',
  },
  commands: {
    updateCurrentFile: 'อัปเดตวันที่ในไฟล์ปัจจุบัน',
    toggleAutoUpdate: 'เปิด/ปิดการอัปเดตอัตโนมัติ',
    pauseAutoUpdate: 'หยุดการอัปเดตอัตโนมัติชั่วคราว 5 นาที',
  },
  statusBar: {
    paused: 'หยุดชั่วคราว',
    pausedWithMinutes: 'หยุดชั่วคราว ({remaining} นาที)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: ตรวจพบและแก้ไขวันที่ที่เรียงผิดลำดับแล้ว ใช้ "ค้นหาวันที่ที่เรียงผิดลำดับ" ในการตั้งค่าเพื่อตรวจสอบ',
    timestampsUpdated: 'อัปเดตวันที่แล้ว',
    fileIgnored: 'ไฟล์ถูกข้ามตามการตั้งค่าปลั๊กอิน',
    failedToUpdateWithReason: 'อัปเดตวันที่ไม่สำเร็จ: {reason}',
    failedToUpdate: 'อัปเดตวันที่ไม่สำเร็จ',
    autoUpdateEnabled: 'เปิดการอัปเดตอัตโนมัติแล้ว',
    autoUpdateDisabled: 'ปิดการอัปเดตอัตโนมัติแล้ว',
    autoUpdatePausedForMinutes:
      'หยุดการอัปเดตอัตโนมัติชั่วคราว {minutes} นาที จะกลับมาทำงานอัตโนมัติ',
    autoUpdateResumed: 'กลับมาอัปเดตอัตโนมัติแล้ว',
    malformedFrontmatter:
      'Frontmatter Date Manager ทำงานไม่สำเร็จ\nคุณสมบัติในไฟล์นี้ไม่ถูกต้อง: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: 'จะเปลี่ยนแปลง {changed} ไฟล์',
    summarySkipped: 'ข้าม {skipped} รายการ',
    summaryErrors: 'ข้อผิดพลาด {errors} รายการ',
    pagerPrev: 'ก่อนหน้า',
    pagerNext: 'ถัดไป',
    pageInfo: 'หน้า {current} จาก {total}',
    downloadFullPreview: 'ดาวน์โหลดตัวอย่างทั้งหมด',
    downloadSuccess:
      'ดาวน์โหลด {count} แถวเป็นไฟล์ {filename} ไปยังโฟลเดอร์ดาวน์โหลดแล้ว',
    downloadFailed: 'ไม่สามารถดาวน์โหลดไฟล์ตัวอย่างได้',
    failureColumnError: 'ข้อผิดพลาด',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'บริการซิงค์ เครื่องมือสำรองข้อมูล และปลั๊กอินอื่น ๆ มักเขียนทับไฟล์โดยไม่ได้เปลี่ยนเนื้อหา ซึ่งทำให้วันที่ของไฟล์บนดิสก์ถูกรีเซ็ต ทำให้ไม่สามารถบอกได้ว่าคุณแก้ไขโน้ตครั้งล่าสุดเมื่อใดจริง ๆ',
      pluginIntro:
        'ปลั๊กอินนี้เขียนวันที่สร้างและวันที่แก้ไขล่าสุดลงในคุณสมบัติของแต่ละโน้ตโดยตรง และตรวจจับการเปลี่ยนแปลงจริงด้วยการเปรียบเทียบเนื้อหา เพื่อให้วันที่ของคุณสะท้อนการแก้ไขจริง ไม่ใช่ผลข้างเคียงจากการซิงค์',
    },
    dates: {
      heading: 'วันที่ที่จะติดตาม',
      enableNoneHint:
        'เปิดวันที่อย่างน้อยหนึ่งรายการด้านบนเพื่อตั้งค่าปลั๊กอิน',
      created: {
        enableName: 'ติดตามวันที่สร้าง',
        enableDesc: 'เพิ่มวันที่สร้างให้กับโน้ตที่ยังไม่มี',
        propertyName: 'คุณสมบัติวันที่สร้าง',
        propertyDesc: 'ชื่อคุณสมบัติที่บันทึกวันที่สร้าง',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'ติดตามวันที่แก้ไขล่าสุด',
        enableDesc: 'อัปเดตวันที่นี้ทุกครั้งที่คุณแก้ไขโน้ต',
        propertyName: 'คุณสมบัติวันที่แก้ไข',
        propertyDesc: 'ชื่อคุณสมบัติที่บันทึกวันที่แก้ไขล่าสุด',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'นับจำนวนการแก้ไข',
        enableDesc:
          'เพิ่มคุณสมบัติตัวเลขที่เพิ่มขึ้นทีละหนึ่งทุกครั้งที่คุณแก้ไขโน้ต เป็นจำนวนกิจกรรมโดยประมาณ ไม่ใช่ประวัติที่แม่นยำ',
        propertyName: 'คุณสมบัติจำนวนการแก้ไข',
        propertyDesc: 'ชื่อคุณสมบัติที่บันทึกจำนวนการแก้ไข',
      },
      viewed: {
        enableName: 'ติดตามวันที่เปิดล่าสุด',
        enableDesc: 'บันทึกวันที่ทุกครั้งที่คุณเปิดโน้ต',
        propertyName: 'คุณสมบัติวันที่เปิด',
        propertyDesc: 'ชื่อคุณสมบัติที่บันทึกวันที่เปิดล่าสุด',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'การจัดรูปแบบวันที่',
      dateFormat: {
        name: 'รูปแบบวันที่',
        desc: 'รูปแบบการเขียนวันที่และเวลาลงในโน้ตของคุณ',
        formatCodesLink: 'ดูรหัสรูปแบบที่ใช้ได้',
        currentlyPreview: 'ตอนนี้: {preview}',
        invalidWithHint: 'รูปแบบไม่ถูกต้อง {hint}',
        invalidFormat: 'สตริงรูปแบบวันที่ไม่ถูกต้อง',
        obsidianDefault:
          "ค่าเริ่มต้นของ Obsidian: yyyy-MM-dd'T'HH:mm:ss (วันที่และเวลา เขตเวลาท้องถิ่น)",
      },
      timezone: {
        name: 'เขตเวลา',
        desc: 'เขตเวลาที่ใช้เมื่อเขียนวันที่ เว้นว่างไว้เพื่อใช้เขตเวลาของอุปกรณ์ของคุณ ({localTz})',
        placeholder: 'ท้องถิ่น ({localTz})',
        resetTooltip: 'รีเซ็ตเป็นเขตเวลาท้องถิ่น',
      },
      numberProperties: {
        name: 'บันทึกวันที่ที่เป็นตัวเลขล้วนโดยไม่ใส่เครื่องหมายคำพูด',
        desc: 'หากรูปแบบวันที่ของคุณเป็นตัวเลขล้วน (เช่น unix timestamp) ให้เขียนเป็นตัวเลขธรรมดา (updated: 1712930400) แทนข้อความในเครื่องหมายคำพูด (updated: "1712930400") ไม่มีผลเมื่อรูปแบบของคุณมีขีดกลางหรือทวิภาค',
      },
    },
    behavior: {
      heading: 'พฤติกรรม',
      autoUpdate: {
        name: 'อัปเดตอัตโนมัติ',
        desc: 'อัปเดตวันที่อัตโนมัติเมื่อคุณแก้ไขโน้ต ใช้งานได้จากแถบคำสั่งด้วย',
      },
      minSeconds: {
        name: 'จำนวนวินาทีขั้นต่ำระหว่างการอัปเดต',
        desc: 'ป้องกันไม่ให้อัปเดตวันที่บ่อยเกินไปขณะที่คุณพิมพ์หรือสลับระหว่างโน้ต',
      },
      changeDetection: {
        name: 'การตรวจจับการเปลี่ยนแปลง (การแฮชเนื้อหา)',
        descEnabled:
          'วันที่แก้ไขล่าสุดจะถูกเขียนเฉพาะเมื่อเนื้อหาของโน้ตเปลี่ยนแปลงจริง ซึ่งป้องกันการอัปเดตปลอมจากปลั๊กอินซิงค์',
        descDisabled:
          'ปิดอยู่ วันที่แก้ไขล่าสุดจะถูกเขียนทุกครั้งที่บันทึก แม้ว่าจะไม่มีอะไรเปลี่ยนแปลง',
      },
      hashTrackingMode: {
        name: 'อะไรนับเป็นการเปลี่ยนแปลง',
        desc: 'ส่วนใดของโน้ตที่นับเป็นการเปลี่ยนแปลง "เนื้อหาเท่านั้น" คือการแก้ไขคุณสมบัติ (แท็ก นามแฝง ฯลฯ) จะไม่อัปเดตวันที่ "คุณสมบัติเท่านั้น" คือการแก้ไขข้อความของโน้ตจะไม่อัปเดตวันที่ "ทั้งสอง" คือการแก้ไขใด ๆ จะอัปเดตวันที่',
        optionBody: 'เนื้อหาของโน้ตเท่านั้น (ค่าเริ่มต้น)',
        optionFrontmatter: 'คุณสมบัติเท่านั้น',
        optionBoth: 'เนื้อหาและคุณสมบัติ',
        changedNotice:
          'เปลี่ยนโหมดการติดตามแล้ว สร้างแคชแฮชใหม่ (ในการดำเนินการแบบกลุ่ม) เพื่อให้วันที่ยังคงแม่นยำ',
      },
      excludeKeys: {
        name: 'ละเว้นคุณสมบัติเหล่านี้',
        desc: 'การแก้ไขคุณสมบัติเหล่านี้จะไม่อัปเดตวันที่ คุณสามารถเพิ่มหลายรายการพร้อมกันได้โดยคั่นด้วยจุลภาค คุณสมบัติ created, updated และ viewed จะถูกละเว้นโดยอัตโนมัติเสมอ',
        placeholder: 'ชื่อคุณสมบัติ เช่น tags',
        addTooltip: 'เพิ่มคุณสมบัติ',
        chipRemoveAriaLabel: 'ลบ {entry}',
      },
    },
    filterRules: {
      name: 'ไฟล์และโฟลเดอร์ที่จะข้าม',
      descIntro:
        'เลือกไฟล์หรือโฟลเดอร์ที่จะไม่แตะต้อง (ไม่มีการอัปเดตวันที่อัตโนมัติ) ',
      descOnePerLine: 'หนึ่งรูปแบบต่อบรรทัด บรรทัดที่ขึ้นต้นด้วย ',
      descCommentsAre: ' คือคอมเมนต์ ขึ้นต้นบรรทัดด้วย ',
      descAddBack: ' เพื่อเพิ่มเส้นทางกลับเข้ามา ',
      descLastWins: 'หากมีหลายบรรทัดที่ตรงกัน บรรทัดสุดท้ายจะมีผล',
      advancedSyntaxLink: 'ไวยากรณ์ขั้นสูง (สไตล์ gitignore)',
      noRulesWarning:
        'ไม่ได้ตั้งกฎไว้ โน้ตทั้งหมดจะได้รับการอัปเดตวันที่อัตโนมัติ',
      placeholderExcludeFolder: '# ยกเว้นโฟลเดอร์',
      placeholderExcludeByPattern: '# ยกเว้นตามรูปแบบ',
      placeholderReinclude: '# เพิ่มไฟล์เฉพาะกลับเข้ามา',
      parseError: 'บรรทัด {lineNumber}: {message} - "{text}"',
      previewButton: 'ดูตัวอย่างไฟล์ที่ตรงกัน',
      previewSummary: 'ติดตาม {tracked} โน้ต, ข้าม {excluded} โน้ต',
      skippedFilesSummary: 'ไฟล์ที่ข้าม ({excluded})',
      skippedMore: '...และอีก {count}',
      reference: {
        summary: 'คู่มืออ้างอิงไวยากรณ์รูปแบบ',
        sectionBasics: 'พื้นฐานไวยากรณ์',
        basicsCommentDesc: 'บรรทัดที่ขึ้นต้นด้วย # จะถูกละเว้น',
        basicsBlankDesc: 'บรรทัดว่างจะถูกละเว้น',
        basicsExcludeDesc: 'ยกเว้น - ไฟล์ภายใน templates/ จะถูกข้าม',
        basicsReincludeDesc: 'เพิ่มกลับ - นำหน้าด้วย ! เพื่อยกเลิกการยกเว้น',
        basicsLastWinsDesc: 'เมื่อมีหลายกฎที่ตรงกัน กฎสุดท้ายจะมีผล',
        sectionExcludeFolder: 'ยกเว้นโฟลเดอร์',
        excludeFolderAllFilesDesc: 'ไฟล์ทั้งหมดภายใน templates/',
        excludeFolderSameEffectDesc: 'ผลเหมือนกัน (สแลชท้ายเป็นทางเลือก)',
        excludeFolderNestedDesc: 'โฟลเดอร์ซ้อน',
        sectionReinclude: 'เพิ่มกลับ (ยกเลิกการยกเว้น)',
        reincludeExcludeWholeDesc: 'ยกเว้นทั้งโฟลเดอร์',
        reincludeKeepDesc: 'แต่ยังคงติดตามไฟล์เฉพาะนี้',
        sectionWildcards: 'ไวลด์การ์ด',
        wildcardStarDesc: 'อักขระใด ๆ ยกเว้น /',
        wildcardDoubleStarDesc: 'อักขระใด ๆ รวมถึง / (ข้ามโฟลเดอร์)',
        wildcardQuestionDesc: 'อักขระเดียวพอดี',
        sectionWildcardExamples: 'ตัวอย่างไวลด์การ์ด',
        wildcardExCanvasRootDesc:
          'ไฟล์ที่ลงท้ายด้วย .canvas.md ที่รากของห้องนิรภัย',
        wildcardExCanvasAnyDesc:
          'ไฟล์ที่ลงท้ายด้วย .canvas.md ในโฟลเดอร์ใดก็ได้',
        wildcardExDailyDesc: 'ไฟล์อย่าง daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'ชื่อไฟล์สองอักขระใน notes/',
        sectionSpecificFiles: 'ไฟล์เฉพาะ',
        specificFilesOneExactDesc: 'ไฟล์หนึ่งที่ตรงกันพอดี',
        specificFilesRootDesc: 'ไฟล์ที่รากของห้องนิรภัย',
        sectionPathsWithSpaces: 'เส้นทางที่มีช่องว่าง',
        pathsWithSpacesAsIsDesc: 'เขียนเส้นทางตามที่เป็นได้เลย',
        pathsWithSpacesNoQuotesDesc: 'ไม่ต้องใส่เครื่องหมายคำพูดรอบช่องว่าง',
        sectionNonLatin: 'อักขระที่ไม่ใช่ละติน',
        nonLatinCyrillicDesc: 'ชื่อโฟลเดอร์อักษรซีริลลิก',
        nonLatinChineseDesc: 'อักขระจีน',
        nonLatinFullPathDesc: 'เส้นทางที่ไม่ใช่ละตินทั้งหมด',
        sectionObsidianExamples: 'ตัวอย่างเฉพาะของ Obsidian',
        obsidianTemplateFolderDesc: 'โฟลเดอร์เทมเพลต',
        obsidianDailyFolderDesc: 'โฟลเดอร์โน้ตประจำวัน',
        obsidianAttachmentsDesc: 'โฟลเดอร์ไฟล์แนบ / สื่อ',
        obsidianCanvasDesc: 'ไฟล์ canvas ทั้งหมด',
        obsidianExcalidrawDesc: 'ภาพวาด Excalidraw ทั้งหมด',
        obsidianInboxDesc: 'โฟลเดอร์กล่องเข้า / กระดาษทด',
        obsidianArchiveDesc: 'โน้ตที่เก็บถาวร',
        sectionAllowlist: 'โหมดรายการอนุญาต (ติดตามเฉพาะโฟลเดอร์ที่ระบุ)',
        allowlistExcludeEverythingDesc: 'ก่อนอื่น ยกเว้นทุกอย่าง',
        allowlistReincludeWantedDesc: 'จากนั้นเพิ่มกลับเฉพาะที่คุณต้องการ',
        allowlistReincludeAnotherDesc: 'เพิ่มอีกโฟลเดอร์กลับเข้ามา',
        emptyNote:
          'เมื่อช่องนี้ว่าง โน้ตทั้งหมดจะได้รับการอัปเดตวันที่อัตโนมัติ',
      },
    },
    inversions: {
      heading: 'วันที่แก้ไขก่อนวันที่สร้าง',
      strategy: {
        name: 'วิธีแก้ไขวันที่ที่เรียงผิดลำดับ',
        desc: 'สิ่งที่ต้องทำเมื่อวันที่แก้ไขล่าสุดเร็วกว่าวันที่สร้าง ใช้กับการแก้ไขอัตโนมัติ และตั้งค่าเริ่มต้นให้กับเครื่องมือแบบกลุ่ม',
        optionDisabled: 'ไม่ต้องแก้ไข (ตรวจจับเท่านั้น)',
        optionCreatedToUpdated: 'ตั้งวันที่สร้างให้เท่ากับวันที่แก้ไขล่าสุด',
        optionUpdatedToCreated: 'ตั้งวันที่แก้ไขล่าสุดให้เท่ากับวันที่สร้าง',
        optionMaxAll: 'ตั้งทั้งสองให้เป็นวันที่ล่าสุดที่สุด',
      },
      tolerance: {
        name: 'ละเว้นความต่างเล็กน้อย (วินาที)',
        desc: 'ละเว้นวันที่ที่เรียงผิดลำดับเมื่อช่องว่างน้อยกว่าค่านี้ ค่าที่น้อยจะซ่อนความต่างของนาฬิกาที่เล็กน้อย',
      },
    },
    advanced: {
      summary: 'ขั้นสูง',
      newFileDelay: {
        name: 'หน่วงเวลาสำหรับไฟล์ใหม่',
        desc: 'รอกี่มิลลิวินาทีก่อนประทับวันที่ลงในโน้ตที่สร้างใหม่ ช่วยหลีกเลี่ยงความขัดแย้งกับปลั๊กอินเทมเพลต ตั้งเป็น 0 เพื่อปิด',
      },
      autoPopulateCache: {
        name: 'เติมแคชอัตโนมัติเมื่อเริ่มต้น',
        desc: 'เมื่อปลั๊กอินโหลด ให้สร้างข้อมูลตรวจจับการเปลี่ยนแปลงสำหรับโน้ตที่ยังไม่มี ทำงานในเบื้องหลัง',
      },
      maxCacheEntries: {
        name: 'จำนวนรายการสูงสุดในแคช',
        desc: 'เมื่อแคชเติบโตเกินขีดจำกัดนี้ รายการที่เก่าที่สุดและไม่ได้ใช้จะถูกลบออก 0 = ไม่จำกัด',
      },
      postUpdateCommand: {
        name: 'คำสั่งหลังการอัปเดต',
        desc: 'เรียกใช้คำสั่ง Obsidian หลังจากอัปเดตวันที่ เว้นว่างไว้เพื่อปิด',
        optionNone: 'ไม่มี',
      },
    },
    bulk: {
      heading: 'การดำเนินการแบบกลุ่ม',
      populate: {
        name: 'ตั้งวันที่จากวันที่ของไฟล์เอง',
        desc: 'เติมวันที่สร้างและวันที่แก้ไขล่าสุดจากวันที่สร้างและวันที่แก้ไขของแต่ละไฟล์บนดิสก์ เหมาะสำหรับการตั้งค่าครั้งแรก',
        button: 'เติมวันที่',
      },
      rename: {
        name: 'เปลี่ยนชื่อคุณสมบัติ',
        desc: 'ย้ายค่าจากชื่อคุณสมบัติเดิมไปยังชื่อใหม่ในโน้ตทั้งหมด มีประโยชน์หลังจากเปลี่ยนชื่อคุณสมบัติด้านบน',
        button: 'เปลี่ยนชื่อคุณสมบัติ',
      },
      reformat: {
        name: 'จัดรูปแบบวันที่ที่มีอยู่ใหม่',
        desc: 'ค้นหาวันที่ที่เขียนในรูปแบบเดิมและเขียนใหม่ในรูปแบบปัจจุบันของคุณ มีประโยชน์หลังจากเปลี่ยนรูปแบบวันที่ด้านบน',
        button: 'จัดรูปแบบวันที่ใหม่',
      },
      findInversions: {
        name: 'ค้นหาวันที่ที่เรียงผิดลำดับ',
        desc: 'สแกนโน้ตของคุณและแสดงรายการที่วันที่แก้ไขล่าสุดเร็วกว่าวันที่สร้าง จากนั้นคุณสามารถใช้การแก้ไขที่เลือกไว้ด้านบนได้',
        button: 'ค้นหาวันที่ที่เรียงผิดลำดับ',
      },
      rebuildCache: {
        name: 'สร้างแคชแฮชใหม่',
        desc: 'คำนวณข้อมูลตรวจจับการเปลี่ยนแปลง (แฮชเนื้อหา) ใหม่สำหรับโน้ตทั้งหมดของคุณ มีประโยชน์หลังจากเปลี่ยนสิ่งที่นับเป็นการเปลี่ยนแปลงด้านบน',
        button: 'สร้างแคชใหม่',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'ตั้งวันที่จากวันที่ของไฟล์เอง',
      configureSubtitleLine1: 'เติมวันที่สร้างและวันที่แก้ไขล่าสุด',
      configureSubtitleLine2: 'จากวันที่สร้างและวันที่แก้ไขของแต่ละไฟล์บนดิสก์',
      modeName: 'ตั้งวันที่ใด',
      modeDesc: 'เลือกว่าจะเติมวันที่ใด',
      modeOptionBoth: 'ทั้งวันที่สร้างและวันที่แก้ไข',
      modeOptionCreated: 'เฉพาะวันที่สร้าง',
      modeOptionUpdated: 'เฉพาะวันที่แก้ไข',
      overrideName: 'ไฟล์ที่มีวันที่อยู่แล้ว',
      overrideDesc: 'เติมเฉพาะวันที่ที่ขาดหายไป หรือเขียนทับวันที่ที่มีอยู่',
      overrideOptionFillMissing: 'เติมเฉพาะที่ขาดหายไป (ปลอดภัย)',
      overrideOptionOverwriteAll: 'เขียนทับทั้งหมด (แทนที่ที่มีอยู่)',
      autoUpdateNoteTitle: 'หมายเหตุเกี่ยวกับการอัปเดตอัตโนมัติ:',
      autoUpdateNoteBody:
        'หากการอัปเดตอัตโนมัติทำงานอยู่ วันที่ของไฟล์เองบนดิสก์อาจสะท้อนการแก้ไขของปลั๊กอินเองอยู่แล้ว ไม่ใช่วันที่ดั้งเดิม เพื่อผลลัพธ์ที่ดีที่สุด ใช้คุณสมบัตินี้ก่อนเปิดการอัปเดตอัตโนมัติ หรือทันทีหลังติดตั้งปลั๊กอิน',
      warningTitleCreatedUnreliable:
        'วันที่สร้างไฟล์ไม่น่าเชื่อถือบนบางแพลตฟอร์ม',
      warningTitlePlatformNote: 'หมายเหตุเกี่ยวกับแพลตฟอร์ม',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'วันที่สร้างไฟล์จริง',
      platformLinux: 'Linux',
      platformLinuxNote: 'ระบบรายงานวันที่ที่ช้ากว่า ไม่ใช่วันที่สร้างจริง',
      platformAndroid: 'Android',
      platformAndroidNote: 'ขึ้นอยู่กับอุปกรณ์ มักไม่น่าเชื่อถือ',
      platformIos: 'iOS',
      platformIosNote: 'โดยทั่วไปน่าเชื่อถือ',
      platformReliable: 'น่าเชื่อถือ',
      platformUnreliable: 'ไม่น่าเชื่อถือ',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (แพลตฟอร์มของคุณ)',
      syncNoteLine1:
        'ห้องนิรภัยที่ซิงค์: วันที่ของไฟล์อาจถูกรีเซ็ตโดยบริการซิงค์',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3: 'วันที่แก้ไขล่าสุดมักน่าเชื่อถือกว่าวันที่สร้าง',
      recommendation: 'คำแนะนำ: ตรวจสอบผลลัพธ์หลังเรียกใช้ สำรองข้อมูลก่อน',
      overwriteWarning:
        'การกระทำนี้จะแทนที่วันที่ที่มีอยู่ในโน้ตของคุณ ไม่สามารถยกเลิกได้ สำรองข้อมูลก่อน',
      noPropertyConfigured:
        'ยังไม่ได้ตั้งชื่อคุณสมบัติสำหรับ: {missing} ตรวจสอบการตั้งค่าปลั๊กอิน',
      previewTitle: 'ตัวอย่าง: ตั้งวันที่',
      noFilesNeedUpdating:
        'ไม่มีไฟล์ที่ต้องอัปเดต ไฟล์ที่เข้าเงื่อนไขทั้งหมดมีวันที่ที่ร้องขอแล้ว',
      previewOverwriteWarning:
        'โหมดเขียนทับ: วันที่ที่มีอยู่จะถูกแทนที่ ไม่สามารถยกเลิกได้ สำรองข้อมูลก่อน',
      settingDates: 'กำลังตั้งวันที่…',
      stopped: 'หยุดแล้ว',
      doneWithErrorsSubtitle: 'อัปเดต {processed} ไฟล์',
      doneTitle: 'เสร็จสิ้น! อัปเดต {processed} ไฟล์',
    },
    rename: {
      configureTitle: 'เปลี่ยนชื่อคุณสมบัติ',
      configureSubtitle:
        'ย้ายค่าจากชื่อคุณสมบัติหนึ่งไปยังอีกชื่อในโน้ตทั้งหมด',
      validationEnterOld: 'ป้อนชื่อคุณสมบัติเดิมเพื่อดำเนินการต่อ',
      validationEnterNew: 'ป้อนชื่อคุณสมบัติใหม่เพื่อดำเนินการต่อ',
      validationMustDiffer: 'ชื่อคุณสมบัติเดิมและใหม่ต้องแตกต่างกัน',
      oldKeyName: 'ชื่อคุณสมบัติเดิม',
      oldKeyDesc: 'ชื่อคุณสมบัติที่ใช้อยู่ในโน้ตของคุณตอนนี้',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'ชื่อคุณสมบัติใหม่',
      newKeyDesc: 'ชื่อคุณสมบัติใหม่ที่จะใช้',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'ลบคุณสมบัติเดิมหลังเปลี่ยนชื่อ',
      deleteOldDesc: 'ลบคุณสมบัติเดิมหลังคัดลอกค่าไปยังคุณสมบัติใหม่',
      namesCannotBeEmpty: 'ชื่อคุณสมบัติว่างไม่ได้',
      previewTitle: 'ตัวอย่าง: เปลี่ยนชื่อคุณสมบัติ',
      noNotesUseProperty: 'ไม่มีโน้ตใดใช้คุณสมบัติ "{oldKey}"',
      conflictWarning:
        '{conflicts} โน้ตมีคุณสมบัติ "{newKey}" อยู่แล้ว ค่าที่มีอยู่จะถูกเขียนทับ',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'คุณสมบัติเดิมจะถูกลบหลังการคัดลอก ไม่สามารถยกเลิกได้ สำรองข้อมูลก่อน',
      renamingProperty: 'กำลังเปลี่ยนชื่อคุณสมบัติ…',
      renameStopped: 'หยุดการเปลี่ยนชื่อแล้ว',
      doneWithErrorsSubtitle: 'อัปเดต {processed} ไฟล์',
      doneTitle: 'เสร็จสิ้น! อัปเดต {processed} ไฟล์',
    },
    reformat: {
      configureTitle: 'ทำให้รูปแบบวันที่เป็นมาตรฐาน',
      configureSubtitle:
        'แยกวิเคราะห์ค่าวันที่ที่มีอยู่และเขียนใหม่โดยใช้รูปแบบปัจจุบันจากการตั้งค่า',
      invalidFormat: 'รูปแบบไม่ถูกต้อง',
      targetFormatName: 'รูปแบบเป้าหมาย',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'ฟิลด์ใดที่จะจัดรูปแบบใหม่',
      scopeDesc: 'เลือกวันที่ที่จะทำให้เป็นมาตรฐาน',
      scopeOptionAll: 'วันที่ทั้งหมด',
      scopeOptionCreated: 'เฉพาะวันที่สร้าง',
      scopeOptionUpdated: 'เฉพาะวันที่แก้ไข',
      scopeOptionViewed: 'เฉพาะวันที่เปิด',
      autoDetectNote:
        'วันที่จะถูกตรวจจับอัตโนมัติจากรูปแบบที่พบบ่อย (ISO 8601, ยุโรป, อเมริกา, วันที่แบบตัวเลข) และเขียนใหม่ในรูปแบบปัจจุบันของคุณ',
      noPropertyConfigured:
        'ยังไม่ได้ตั้งชื่อคุณสมบัติสำหรับ: {missing} ตรวจสอบการตั้งค่าปลั๊กอิน',
      previewTitle: 'ตัวอย่าง: ทำให้วันที่เป็นมาตรฐาน',
      noChangeAmbiguous:
        'ยังไม่มีอะไรให้แปลง {ambiguousCount} วันที่อ่านได้สองแบบและถูกปล่อยไว้ไม่เปลี่ยนแปลง เลือกลำดับวัน/เดือนด้านบนเพื่อแปลงพวกมัน',
      noChangeDefault:
        'ไม่มีไฟล์ที่ต้องจัดรูปแบบใหม่ วันที่ทั้งหมดอยู่ในรูปแบบเป้าหมายแล้ว หรือไม่สามารถแยกวิเคราะห์ได้',
      errorWarningNoChange:
        '{errorCount} ไฟล์มีวันที่ที่ไม่สามารถแยกวิเคราะห์ได้',
      errorWarningWillSkip:
        '{errorCount} ไฟล์มีวันที่ที่ไม่สามารถแยกวิเคราะห์ได้ ไฟล์เหล่านี้จะถูกข้าม',
      checkNote:
        'แถวที่ทำเครื่องหมาย [check] สามารถอ่านได้สองแบบ ยืนยันว่าวันที่ใหม่ดูถูกต้อง',
      rewriteWarning:
        'การกระทำนี้เขียนทับค่าวันที่ที่มีอยู่ในตำแหน่งเดิม ไม่สามารถยกเลิกได้ สำรองข้อมูลก่อน',
      ambiguityName: 'วันที่ที่อ่านได้สองแบบ',
      ambiguityDesc:
        '{ambiguousCount} วันที่อาจหมายถึงวันก่อนหรือเดือนก่อน (เช่น 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' ระบบของคุณแนะนำเดือนก่อน',
      detectedHintDayFirst: ' ระบบของคุณแนะนำวันก่อน',
      ambiguityOptionSkip: 'ปล่อยวันที่ที่ไม่ชัดเจนไว้ไม่เปลี่ยนแปลง',
      ambiguityOptionDmy: 'วันก่อน (01/05 = วันที่ 1 เดือน 5)',
      ambiguityOptionMdy: 'เดือนก่อน (01/05 = เดือน 1 วันที่ 5)',
      cellCouldNotRead: '{oldValue} (อ่านวันที่ไม่ได้)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'กำลังจัดรูปแบบวันที่ใหม่…',
      reformatStopped: 'หยุดการจัดรูปแบบใหม่แล้ว',
      doneWithErrorsSubtitle: 'อัปเดต {processed} ไฟล์',
      doneTitle: 'เสร็จสิ้น! อัปเดต {processed} ไฟล์',
    },
    inversions: {
      scanningTitle: 'กำลังค้นหาวันที่ที่เรียงผิดลำดับ…',
      foundTitle: 'พบ {count} โน้ตที่มีวันที่เรียงผิดลำดับ',
      foundSubtitle:
        'โน้ตเหล่านี้มีวันที่แก้ไขล่าสุดเร็วกว่าวันที่สร้าง เลือกวิธีแก้ไขด้านล่าง หรือปิดเพื่อตรวจสอบด้วยตนเอง',
      noneFound: 'ไม่พบวันที่ที่เรียงผิดลำดับ',
      strategyName: 'วิธีแก้ไข',
      strategyDesc: 'เลือกวิธีแก้ไขวันที่',
      strategyOptionDisabled: 'ไม่ต้องแก้ไข (ตรวจสอบเท่านั้น)',
      strategyOptionCreatedToUpdated:
        'ตั้งวันที่สร้างให้เท่ากับวันที่แก้ไขล่าสุด',
      strategyOptionUpdatedToCreated:
        'ตั้งวันที่แก้ไขล่าสุดให้เท่ากับวันที่สร้าง',
      strategyOptionMaxAll: 'ตั้งทั้งสองให้เป็นวันที่ล่าสุดที่สุด',
      toleranceNote:
        'กำลังละเว้นความต่างที่น้อยกว่า {tolerance} วินาที (ตั้งในการตั้งค่า)',
      columnDelta: 'Δ',
      fixWarning:
        'การกระทำนี้จะแก้ไข {count} โน้ต ไม่สามารถยกเลิกได้ สำรองข้อมูลก่อน',
      fixingDates: 'กำลังแก้ไขวันที่…',
      stopped: 'หยุดการดำเนินการแบบกลุ่มแล้ว',
      fixedNotice: 'แก้ไข {processed} โน้ตแล้ว',
      doneWithErrorsSubtitle: 'แก้ไข {processed} โน้ต',
      doneTitle: 'เสร็จสิ้น! คุณสามารถปิดหน้าต่างนี้ได้อย่างปลอดภัย',
    },
    rebuildCache: {
      loadingFiles: 'กำลังโหลดไฟล์…',
      confirmTitle: 'สร้างข้อมูลตรวจจับการเปลี่ยนแปลงใหม่สำหรับ {count} ไฟล์',
      confirmSubtitle:
        'การกระทำนี้คำนวณลายนิ้วมือเนื้อหา (แฮชเนื้อหา) ที่ใช้ตรวจจับการแก้ไขจริงใหม่ ไม่เปลี่ยนแปลงโน้ตของคุณ',
      rebuilding: 'กำลังสร้างใหม่…',
      stopped: 'หยุดการดำเนินการแบบกลุ่มแล้ว',
      doneWithErrorsSubtitle: 'ประมวลผล {processed} ไฟล์',
      doneTitle: 'เสร็จสิ้น! คุณสามารถปิดหน้าต่างนี้ได้อย่างปลอดภัย',
    },
  },
};
