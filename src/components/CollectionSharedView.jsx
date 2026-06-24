import React from 'react';

const CollectionSharedView = ({
  title = "Resume",
  description = "Resume inspiration and portfolio references",
  authorName = "Vincent",
  updatedAgo = "2 hours ago",
  itemsCount = 6,
  coverImage = "https://placehold.co/40x38",
  iconImage = "https://placehold.co/18x18"
}) => {
  return (
    <div style={{
      width: '100%', 
      height: '100vh', 
      paddingTop: 40, 
      paddingBottom: 52, 
      background: 'white', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      display: 'inline-flex'
    }}>
      <div style={{alignSelf: 'stretch', flex: '1 1 0', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', display: 'flex'}}>
          <div style={{alignSelf: 'stretch', height: 77, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 18, display: 'flex', padding: '0 24px'}}>
              <div style={{width: '100%', maxWidth: 1160, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5, display: 'flex'}}>
                  <div style={{alignSelf: 'stretch', color: 'black', fontSize: 22, fontFamily: 'Inter, sans-serif', fontWeight: '600', wordWrap: 'break-word'}}>{title}</div>
                  <div style={{alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex'}}>
                      <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'flex'}}>
                          <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 6, display: 'flex'}}>
                              <div style={{width: 23, height: 23, background: '#D9D9D9', borderRadius: 9999}} />
                              <div style={{color: 'var(--Darktheme-Secondary, #2C2C2C)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '600', wordWrap: 'break-word'}}>Shared by {authorName}</div>
                          </div>
                          <div style={{width: 15, height: 0, transform: 'rotate(90deg)', transformOrigin: 'top left', outline: '1px black solid', outlineOffset: '-0.50px'}}></div>
                          <div style={{color: 'var(--Lighttheme-mutedforeground, #8E8E93)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '600', wordWrap: 'break-word'}}>Updated {updatedAgo}</div>
                      </div>
                      <div style={{width: 91, height: 27, background: 'var(--Lighttheme-secondary, #F7F7F7)', borderRadius: 11, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex'}}>
                          <div style={{width: 12.19, height: 12.18, transform: 'rotate(180deg)', transformOrigin: 'top left', outline: '1px black solid', outlineOffset: '-0.50px'}} />
                          <div style={{color: 'black', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '600', wordWrap: 'break-word'}}>View only</div>
                      </div>
                  </div>
              </div>
              <div style={{alignSelf: 'stretch', height: 0, outline: '0.40px var(--Lighttheme-mutedforeground, #8E8E93) solid', outlineOffset: '-0.20px'}}></div>
          </div>
          <div style={{alignSelf: 'stretch', flex: '1 1 0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', padding: '24px'}}>
              <div style={{width: 287, height: 291, background: 'white', boxShadow: '8px 0px 37.6px rgba(0, 0, 0, 0.05)', borderRadius: 18, outline: '1px #C8C8C8 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32, display: 'inline-flex'}}>
                  <img style={{width: 40, height: 38}} src={coverImage} alt="Cover" />
                  <div style={{alignSelf: 'stretch', paddingLeft: 44, paddingRight: 44, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 27, display: 'flex'}}>
                      <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 27, fontFamily: 'Inter, sans-serif', fontWeight: '700', lineHeight: '33px', wordWrap: 'break-word'}}>{title}</div>
                      <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Lighttheme-mutedforeground, #8E8E93)', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: '500', lineHeight: '24px', wordWrap: 'break-word'}}>{description}</div>
                      <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 11, display: 'inline-flex'}}>
                          <div style={{width: 13, height: 16, position: 'relative'}}>
                              <div style={{width: 13, height: 16, left: 0, top: 0, position: 'absolute', outline: '1.50px black solid', outlineOffset: '-0.75px'}} />
                          </div>
                          <div style={{textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: '500', lineHeight: '24px', wordWrap: 'break-word'}}>{itemsCount} items</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 24, display: 'inline-flex'}}>
          <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'flex'}}>
              <div style={{color: 'black', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: '500', wordWrap: 'break-word'}}>Made with </div>
              <div style={{width: 18, height: 18, position: 'relative'}}>
                  <img style={{width: 18, height: 18, left: 0, top: 0, position: 'absolute'}} src={iconImage} alt="Icon" />
              </div>
              <div style={{color: 'black', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: '600', wordWrap: 'break-word'}}>IntoDay</div>
          </div>
          <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 7, display: 'flex'}}>
              <div style={{color: 'var(--Lighttheme-Foreground, #111111)', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: '500', wordWrap: 'break-word'}}>Create your own</div>
              <div style={{width: 13, height: 8, position: 'relative'}}>
                  <div style={{width: 13, height: 8, left: 0, top: 0, position: 'absolute', outline: '1.50px black solid', outlineOffset: '-0.75px'}} />
              </div>
          </div>
      </div>
    </div>
  );
};

export default CollectionSharedView;
