import json
from urllib.parse import urlparse

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest

from app.core.config import settings


def get_client():
    credentials = json.loads(settings.ga_credentials_json)

    return BetaAnalyticsDataClient.from_service_account_info(credentials)


def extrair_path(url: str) -> str:
    return urlparse(url).path


def get_views_by_url(url: str) -> int:
    client = get_client()
    path = extrair_path(url)

    request = RunReportRequest(
        property=f"properties/{settings.ga4_property_id}",
        dimensions=[{"name": "pagePath"}],
        metrics=[{"name": "screenPageViews"}],
        date_ranges=[{"start_date": "30daysAgo", "end_date": "today"}],
        dimension_filter={
            "filter": {
                "field_name": "pagePath",
                "string_filter": {
                    "match_type": "EXACT",
                    "value": path,
                }
            }
        },
    )

    response = client.run_report(request)

    if not response.rows:
        return 0

    return int(response.rows[0].metric_values[0].value)