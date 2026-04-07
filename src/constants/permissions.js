export const ROLE_PERMISSIONS = {
  it_admin: [
    'view_dashboard',
    'view_incidents',
    'assign_incident',
    'update_incident',
    'delete_incident',
    'manage_users',
    'manage_roles',
    'manage_config',
    'view_reports',
    'send_alert',
  ],
  dispatcher: [
    'view_dashboard',
    'view_incidents',
    'assign_incident',
    'update_incident',
  ],
  sms_intake_officer: [
    'view_dashboard',
    'view_incidents',
    'create_sms_incident',
  ],
  field_officer: [
    'view_dashboard',
    'view_assigned_incidents',
  ],
}

export const ROLE_LABELS = {
  it_admin: 'IT Admin',
  dispatcher: 'Dispatcher',
  sms_intake_officer: 'SMS Intake Officer',
  field_officer: 'Field Officer',
}

export const ALL_PERMISSION_KEYS = [
  'view_dashboard',
  'view_incidents',
  'view_assigned_incidents',
  'create_incident',
  'create_sms_incident',
  'assign_incident',
  'update_incident',
  'delete_incident',
  'manage_users',
  'manage_roles',
  'manage_config',
  'view_reports',
  'send_alert',
]
