package com.careeragent.documents

import com.careeragent.documents.application.DocumentCareerPeriod
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class DocumentCareerPeriodTest {
    @Test fun `explicit local and ISO months preserve their endpoint positions`() {
        assertThat(DocumentCareerPeriod.parse("08.2023 – 01.2026")).isEqualTo(DocumentCareerPeriod.Months("2023-08","2026-01"))
        assertThat(DocumentCareerPeriod.parse("08/2023-01/2026")).isEqualTo(DocumentCareerPeriod.Months("2023-08","2026-01"))
        assertThat(DocumentCareerPeriod.parse("2023-08 – 2026-01")).isEqualTo(DocumentCareerPeriod.Months("2023-08","2026-01"))
    }
    @Test fun `year precision is not turned into invented months or a shifted start date`() {
        assertThat(DocumentCareerPeriod.parse("2023 – 2026")).isEqualTo(DocumentCareerPeriod.Months(null,null))
        assertThat(DocumentCareerPeriod.parse("2023 – 01.2026")).isEqualTo(DocumentCareerPeriod.Months(null,"2026-01"))
        assertThat(DocumentCareerPeriod.parse("08.2023 – 2026")).isEqualTo(DocumentCareerPeriod.Months("2023-08",null))
    }
    @Test fun `ongoing and single month have no invented end`() {
        assertThat(DocumentCareerPeriod.parse("08.2023 – present")).isEqualTo(DocumentCareerPeriod.Months("2023-08",null))
        assertThat(DocumentCareerPeriod.parse("2023-08 – nå")).isEqualTo(DocumentCareerPeriod.Months("2023-08",null))
        assertThat(DocumentCareerPeriod.parse("08.2023")).isEqualTo(DocumentCareerPeriod.Months("2023-08",null))
    }
    @Test fun `invalid months day precision and free text do not provide misleading endpoints`() {
        for(period in listOf("13.2023 – 01.2026","2023-00 – 2026-01","17.08.2023 – 01.2026","from 08.2023 to 01.2026")) {
            assertThat(DocumentCareerPeriod.parse(period)).isEqualTo(DocumentCareerPeriod.Months(null,null))
        }
    }
}
