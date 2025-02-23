# Comment types

We have better comments configured with some extra comment classes. When the plugin is installed, you will get nice colour highlighting. They also make for good grep targets. The different kinds are documented here:

## <span style="color:#FCD34D">// BREAKING</span>

indicates that an API has changed and mau need review at it's call sites.

## <span style="color:#DB2777">// pin</span>

Indicates something is in need of refactoring, but we don't want to deal with it right now. we have 'put a pin in it'.

## <span style="color:#34d399">// MOVE</span>

a special case of TODO - this item needs to move somewhere else.

## <span style="color:#FF8C00">// TODO</span>

a general todo comment, easy to search for.

## <span style="color:#a3e635">// ok</span>

indicates something has been reviewed and it looks OK - we are safe to ignore it. If you come across one in the wild, its probably safe to remove it. These should only ever be temporary.

## <span style="color:#e7000b;text-decoration-line: underline;font-weight:bold;">// WARNING</span>

indicates a potential bug has been identified and likely needs to be fixed
