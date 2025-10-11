(async()=>{
  try{
    const pdfjs = (await import('../node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
    const fetch = (await import('node-fetch')).default;
    const url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const r = await fetch(url);
    const ab = await r.arrayBuffer();
    const uint8 = new Uint8Array(ab);
    const loadingTask = pdfjs.getDocument({ data: uint8 });
    const pdfDoc = await loadingTask.promise;
    let full = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      full += content.items.map(it => it.str || '').join(' ') + '\n';
    }
    const { RecursiveCharacterTextSplitter } = await import('../node_modules/@langchain/textsplitters/dist/index.js');
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 50, chunkOverlap: 10 });
    const docs = await splitter.createDocuments([full.trim()]);
    console.log('docs', docs.length);
    console.log('first chunk:', docs[0].pageContent);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
