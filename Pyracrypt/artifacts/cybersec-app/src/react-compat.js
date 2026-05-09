import * as React from "react";

const sec = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
if (sec) {
  if (!sec.ReactCurrentOwner) {
    sec.ReactCurrentOwner = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      ?.A ?? { current: null };
  }
  if (!sec.ReactCurrentDispatcher) {
    sec.ReactCurrentDispatcher = { current: null };
  }
  if (!sec.ReactCurrentBatchConfig) {
    sec.ReactCurrentBatchConfig = { transition: null };
  }
}
