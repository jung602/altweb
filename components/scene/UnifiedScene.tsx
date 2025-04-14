import React, { useCallback } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { VerticalTitles } from '../ui/Titles';
import { LabelNavigation } from '../layout/LabelNav';
import { IndexView } from '../ui/IndexView';
import SceneController from './controller/SceneController';
import GradientOverlay from './ui/GradientOverlay';
import CloseButton from './ui/CloseButton';

/**
 * 통합 씬 컴포넌트
 * 여러 3D 씬을 관리하고 표시하는 컴포넌트
 */
export default function UnifiedScene() {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isIndexView = useSceneStore((state) => state.isIndexView);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  // 인덱스 뷰인 경우 인덱스 컴포넌트를 표시
  if (isIndexView) {
    return <IndexView />;
  }

  return (
    <>
      <div className="fixed inset-0 overflow-hidden">
        {/* 확장 모드 UI */}
        {isExpanded && (
          <>
            <CloseButton onClick={handleExpandToggle} />
            <LabelNavigation />
          </>
        )}

        {/* 상단/하단 그라디언트 */}
        <GradientOverlay position="top" />
        <GradientOverlay position="bottom" />

        {/* 씬 컨트롤러 */}
        <SceneController />
      </div>

      {/* 세로 타이틀 */}
      <VerticalTitles />
    </>
  );
}