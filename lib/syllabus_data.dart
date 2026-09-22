class SyllabusData {
  static List<Map<String,dynamic>> initialNodes() {
    final out=<Map<String,dynamic>>[];
    void add(String mission,String subject,List<String> topics) {
      final sid=mission+'-'+subject.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'),'_');
      out.add({'id':sid,'missionId':mission,'kind':'subject','name':subject,'parentId':null,'status':'not-started','source':'seed-syllabus'});
      for (var i=0;i<topics.length;i++) {
        final tid=sid+'-t'+(i+1).toString();
        out.add({'id':tid,'missionId':mission,'kind':'topic','name':topics[i],'parentId':sid,'status':'not-started','order':i,'source':'seed-syllabus'});
      }
    }
    add('pcs','History & Culture',['Ancient India','Medieval India','Modern India','Indian National Movement','Art & Culture']);
    add('pcs','Indian Polity & Governance',['Constitution','Fundamental Rights & Duties','Parliament & State Legislatures','Executive & Judiciary','Constitutional & Statutory Bodies','Local Government','Governance & Public Policy']);
    add('pcs','Indian Economy',['Basic Economy','National Income & Growth','Inflation & Monetary Policy','Fiscal Policy & Budget','Banking & Financial System','Agriculture & Inclusive Growth']);
    add('pcs','Geography',['Physical Geography','Indian Geography','World Geography','Resources & Industries','Environment & Ecology']);
    add('pcs','General Science & Technology',['Physics Basics','Chemistry Basics','Biology & Health','Space & Defence Technology','ICT & Emerging Technology']);
    add('pcs','Uttar Pradesh',['UP History & Culture','UP Geography & Resources','UP Economy & Agriculture','UP Government & Schemes','UP Current Affairs']);
    add('pcs','Current Affairs & General Issues',['National Events','International Events','Science & Environment Current Affairs','Reports, Indices & Institutions']);
    add('roaro','General Studies',['General Science','History of India','Indian National Movement','Indian Polity','Economy & Culture','Indian Agriculture, Commerce & Trade','Population, Ecology & Urbanization','World Geography & Natural Resources','Current National & International Events','General Intelligentsia','Uttar Pradesh Special Knowledge']);
    add('roaro','General Hindi',['Synonyms','Antonyms','One-word Substitution','Sentence & Spelling Correction','Special/Noun-Adjective Usage','Vocabulary & Grammar']);
    add('roaro','Mains Hindi & Drafting',['Passage Heading, Precis & Explanation','Government Letter Precis','Official/Demi-official Letter','Office Memo/Circular','Communique/Annotation/Reports/Reminder','Administrative & Commercial Vocabulary','Computer Knowledge']);
    add('roaro','Hindi Essay',['Literature & Culture','Social Issues','Political Issues','Science, Ecology & Technology','Economy & Agriculture','National & International Events','Natural Calamities','National Development Plans']);
    add('chemistry','Physical Chemistry',['Gaseous State','Liquid State','Solid State','Thermodynamics & Thermochemistry','Dilute Solutions','Surface Chemistry & Adsorption','Chemical Kinetics','Chemical Equilibrium','Electrochemistry','Colloids','Molecular Structure & Spectroscopy','Molecular/Statistical Thermodynamics','Photochemistry','Phase Equilibrium','Ionic Equilibrium']);
    add('chemistry','Inorganic Chemistry',['Atomic Structure','Chemical Bonding','Nuclear Chemistry','s-Block Elements','p-Block Elements','d-Block Elements','Coordination Compounds','Organometallic Chemistry','Bioinorganic Chemistry','f-Block Elements']);
    add('chemistry','Organic Chemistry',['General Organic Chemistry','Reaction Mechanisms','Aromatic Compounds','Stereochemistry','Organic Synthesis','Reactive Intermediates','Haloalkanes & Haloarenes','Alcohols, Phenols & Ethers','Aldehydes, Ketones & Carboxylic Acids','Amines','Heterocyclic Chemistry','Pericyclic Reactions','Polymers & Macromolecules','Carbohydrates','Biomolecules, Vitamins & Hormones','Chemistry in Everyday Life','Name Reactions']);
    return out;
  }
}