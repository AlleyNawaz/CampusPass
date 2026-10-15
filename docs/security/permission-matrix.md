# Initial permission matrix

| Resource/action             | Anonymous |              Student |           Organizer |              Gate staff |               University admin |   Platform admin |
| --------------------------- | --------: | -------------------: | ------------------: | ----------------------: | -----------------------------: | ---------------: |
| Public published event list |       Yes |                  Yes |                 Yes |                     Yes |                            Yes |              Yes |
| Campus-only event list      |        No | Verified campus only |       Scoped campus | Assignment context only |                 Own university |   Audited global |
| Free registration           |        No |        Eligible self |       No by default |                      No |                             No |               No |
| Ticket credential view      |        No |      Own ticket only |       No by default |   No (scan result only) |                  No by default | Break-glass only |
| Redeem ticket               |        No |                   No |                  No |   Assigned event + gate |                  No by default |    No by default |
| Event draft/edit            |        No |                   No |      Scoped society |                      No | Review/override own university |   Audited global |
| Audit export                |        No |                   No | Scoped event subset |                      No |                 Own university |   Audited global |

Sprint 0 API enforces only public event discovery, student free registration, and assigned gate-staff redemption. Other rows are planned policy, not implemented claims.
