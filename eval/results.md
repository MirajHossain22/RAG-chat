# RAG Evaluation Results

Generated: 2026-10-29T19:54:30.050Z

## Configuration

- Sample: `riverbend-solar-pilot-report.pdf` (6 pages, 6 chunks)
- Questions evaluated: 20
- Chat model: `gemini-3.1-flash-lite`
- Embedding model: `gemini-embedding-001` (768 dimensions)
- Retrieval: top 6, cosine threshold 0.54
- Correctness rule: at least 60% of expected keywords must appear
- Retrieval rule: the expected page must rank first

## Summary

| Metric | Result |
| --- | ---: |
| Top-1 retrieval hit rate | 93.8% (15/16) |
| Answer correctness (keyword) | 100.0% (16/16) |
| Refusal accuracy | 100.0% (4/4) |
| Average latency | 3005 ms |
| Failed cases | 0 |

## Per-question results

| ID | Answerable | Expected page | Top page | Similarity | Retrieval hit | Outcome | Latency ms |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| q01 | Yes | 1 | 1 | 0.801 | Yes | PASS | 2963 |
| q02 | Yes | 1 | 1 | 0.731 | Yes | PASS | 4553 |
| q03 | Yes | 1 | 1 | 0.696 | Yes | PASS | 2066 |
| q04 | Yes | 2 | 2 | 0.662 | Yes | PASS | 2239 |
| q05 | Yes | 2 | 2 | 0.656 | Yes | PASS | 2717 |
| q06 | Yes | 2 | 2 | 0.549 | Yes | PASS | 3266 |
| q07 | Yes | 3 | 3 | 0.761 | Yes | PASS | 3748 |
| q08 | Yes | 3 | 3 | 0.796 | Yes | PASS | 2596 |
| q09 | Yes | 3 | 3 | 0.717 | Yes | PASS | 11691 |
| q10 | Yes | 4 | 4 | 0.704 | Yes | PASS | 2191 |
| q11 | Yes | 4 | 4 | 0.671 | Yes | PASS | 2018 |
| q12 | Yes | 4 | 4 | 0.775 | Yes | PASS | 2115 |
| q13 | Yes | 5 | 5 | 0.709 | Yes | PASS | 1813 |
| q14 | Yes | 5 | 5 | 0.744 | Yes | PASS | 2308 |
| q15 | Yes | 5 | 1 | 0.581 | No | PASS | 2124 |
| q16 | Yes | 6 | 6 | 0.715 | Yes | PASS | 2454 |
| q17 | No | - | 1 | 0.625 | - | PASS | 3608 |
| q18 | No | - | 1 | 0.606 | - | PASS | 1887 |
| q19 | No | - | 3 | 0.635 | - | PASS | 1798 |
| q20 | No | - | 5 | 0.608 | - | PASS | 1948 |

## Answer details

### q01: How long did the Riverbend Community Solar Pilot run?

- Expected: It ran for 18 months, from January 2024 through June 2025.
- Actual: The Riverbend Community Solar Pilot ran for 18 months, from January 2024 through June 2025 [1].
- Expected page: 1
- Retrieved top page: 1

### q02: How many households participated and which neighborhoods did the pilot serve?

- Expected: It served 240 households in Northbank and East Junction.
- Actual: The Riverbend Community Solar Pilot served 240 households [1]. The pilot served the Northbank and East Junction neighborhoods [1].
- Expected page: 1
- Retrieved top page: 1

### q03: What total solar capacity was installed?

- Expected: The pilot installed 1.2 megawatts across three municipal sites.
- Actual: The Riverbend Community Solar Pilot installed a total of 1.2 megawatts of solar capacity [1].
- Expected page: 1
- Retrieved top page: 1

### q04: Which site had the largest installation and what was its capacity?

- Expected: The Riverbend Water Treatment Plant had the largest installation at 0.5 MW.
- Actual: The site with the largest installation was the Riverbend Water Treatment Plant, which had a capacity of 0.5 MW [1].
- Expected page: 2
- Retrieved top page: 2

### q05: Did households have to pay an enrollment fee?

- Expected: No household paid an enrollment fee.
- Actual: No, households did not pay an enrollment fee [1].
- Expected page: 2
- Retrieved top page: 2

### q06: Which languages were available through the support team?

- Expected: Support was available in English, Spanish, and Bengali.
- Actual: The multilingual support team offered assistance in English, Spanish, and Bengali [1].
- Expected page: 2
- Retrieved top page: 2

### q07: How much electricity did the installations generate during the pilot?

- Expected: They generated 1.84 gigawatt-hours.
- Actual: The installations generated 1.84 gigawatt-hours of electricity during the 18-month pilot [1].
- Expected page: 3
- Retrieved top page: 3

### q08: What were the average system uptime and household bill reduction?

- Expected: Average uptime was 96.4 percent and bills fell by an average of 23 percent.
- Actual: During the 18-month pilot, the average system uptime was 96.4 percent [1]. Participating households experienced an average electricity bill reduction of 23 percent [1].
- Expected page: 3
- Retrieved top page: 3

### q09: What was the estimated avoided carbon impact?

- Expected: The project avoided an estimated 1,120 metric tons of carbon dioxide equivalent.
- Actual: The Riverbend Community Solar Pilot avoided an estimated 1,120 metric tons of carbon dioxide equivalent compared with the regional grid mix [1].
- Expected page: 3
- Retrieved top page: 3

### q10: What percentage of survey respondents rated the program good or excellent?

- Expected: 82 percent rated it good or excellent.
- Actual: In the final participant survey, 82 percent of respondents rated the program good or excellent [1].
- Expected page: 4
- Retrieved top page: 4

### q11: What was the most common participant complaint?

- Expected: Monthly bill-credit calculations were difficult to understand.
- Actual: The most common complaint from participants was that the monthly credit calculations were difficult to understand [1].
- Expected page: 4
- Retrieved top page: 4

### q12: How many residents completed solar training and how many found energy-sector jobs?

- Expected: 31 residents completed training and 19 found energy-sector employment within three months.
- Actual: Thirty-one residents completed the solar training program, and 19 of those participants obtained energy-sector employment within three months [1].
- Expected page: 4
- Retrieved top page: 4

### q13: What was the total project cost and how much did the state grant cover?

- Expected: The project cost 2.4 million dollars and the state grant covered 55 percent.
- Actual: The total project cost for the Riverbend Community Solar Pilot was 2.4 million dollars [1]. The state clean-energy grant covered 55 percent of that cost [1].
- Expected page: 5
- Retrieved top page: 5

### q14: What annual savings and payback period were projected?

- Expected: Annual value was projected at 184,000 dollars with a 12-year simple payback.
- Actual: The Riverbend Solar Pilot projected the following financial results:  *   **Annual Savings:** The installations are expected to produce $184,000 in annual electricity savings and renewable-energy value [1]. *   **Payback Period:** The modeled simple payback period is 12 years [1].
- Expected page: 5
- Retrieved top page: 5

### q15: What caused the seven-week construction delay?

- Expected: Interconnection approval delayed construction by seven weeks.
- Actual: The seven-week construction delay was caused by interconnection approval [2].
- Expected page: 5
- Retrieved top page: 1

### q16: What expansion and battery actions did the report recommend?

- Expected: It recommended expanding to 2.5 MW and adding battery storage at the transit depot after a fire-safety review.
- Actual: The report recommends the following expansion and battery-related actions:  *   **Capacity Expansion:** Increase the total community-solar capacity to 2.5 MW [1]. *   **Battery Storage:** Add battery storage at the transit depot [1]. *   **Safety Review:** Complete a battery fire-safety review before proceeding with the expansion [1]. *   **Interconnection:** Negotiate a faster interconnection timeline with the utility before expanding [1]. *   **Enrollment Priority:** Retain priority enrollment for households below 80 percent of the area median income [1].
- Expected page: 6
- Retrieved top page: 6

### q17: Who was the chief executive officer of the solar equipment manufacturer?

- Expected: The document does not identify a solar equipment manufacturer or its CEO.
- Actual: I couldn't find that in your documents
- Expected page: unanswerable
- Retrieved top page: 1

### q18: How many wind turbines were installed by the project?

- Expected: The document does not discuss wind turbines.
- Actual: I couldn't find that in your documents
- Expected page: unanswerable
- Retrieved top page: 1

### q19: How much revenue came from selling carbon credits?

- Expected: The document does not report carbon-credit sales revenue.
- Actual: I couldn't find that in your documents
- Expected page: unanswerable
- Retrieved top page: 3

### q20: What was the battery supplier's warranty length?

- Expected: The document does not name a battery supplier or warranty.
- Actual: I couldn't find that in your documents
- Expected page: unanswerable
- Retrieved top page: 5
